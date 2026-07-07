import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import type { ProviderName } from "./types";

export type MercadoPagoEnvironment = "sandbox" | "production";

export type MercadoPagoCredentials = {
  environment: MercadoPagoEnvironment;
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  applicationId?: string;
  clientId?: string;
  clientSecret?: string;
};

type ProviderAccountRow = {
  id: string;
  provider: ProviderName;
  environment: "sandbox" | "production";
  display_name: string;
  credentials_secret_ref: string;
  webhook_secret_ref: string;
  is_active: boolean;
};

type SettlementAccountRow = {
  id: string;
  provider_account_id: string;
  country_code: string;
  currency: string;
  bank_name: string;
  account_alias: string;
  account_reference_secret_ref: string;
};

export type PaymentRuntimeConfiguration = {
  activeProvider: ProviderName;
  environment: "sandbox" | "production";
  providerAccountId?: string;
  providerDisplayName?: string;
  credentialsSecretRef?: string;
  webhookSecretRef?: string;
  webhookMockSecret?: string;
  settlementAccount?: {
    id: string;
    countryCode: string;
    currency: string;
    bankName: string;
    accountAlias: string;
    accountReferenceSecretRef: string;
  };
  subscriptionConfig: Record<string, unknown>;
  retryConfig: Record<string, unknown>;
  connectionStatus: "unknown" | "not_connected" | "connected" | "degraded";
  mercadoPagoCredentials?: MercadoPagoCredentials;
};

function readFirstDefinedEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function toProvider(value: string | undefined): ProviderName {
  if (value === "stripe" || value === "mercadopago" || value === "openpay" || value === "custom") {
    return value;
  }

  return "custom";
}

function toEnvironment(value: string | undefined): "sandbox" | "production" {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "sandbox" || normalized === "test" ? "sandbox" : "production";
}

export function resolveMercadoPagoEnvironment(value: string | undefined): MercadoPagoEnvironment {
  return toEnvironment(value);
}

export function getMercadoPagoCredentials(environment: MercadoPagoEnvironment): MercadoPagoCredentials {
  const sandbox = environment === "sandbox";
  const prefix = sandbox ? "MERCADOPAGO_SANDBOX" : "MERCADOPAGO_PRODUCTION";
  const legacyPrefix = sandbox ? "MERCADOPAGO_TEST" : "MERCADOPAGO_PROD";

  return {
    environment,
    publicKey: readFirstDefinedEnv(`${prefix}_PUBLIC_KEY`, `${legacyPrefix}_PUBLIC_KEY`) ?? "",
    accessToken: readFirstDefinedEnv(`${prefix}_ACCESS_TOKEN`, `${legacyPrefix}_ACCESS_TOKEN`) ?? "",
    webhookSecret: readFirstDefinedEnv(`${prefix}_WEBHOOK_SECRET`, `${legacyPrefix}_WEBHOOK_SECRET`) ?? "",
    applicationId: readFirstDefinedEnv(`${prefix}_APPLICATION_ID`, `${legacyPrefix}_APPLICATION_ID`),
    clientId: readFirstDefinedEnv(`${prefix}_CLIENT_ID`, `${legacyPrefix}_CLIENT_ID`),
    clientSecret: readFirstDefinedEnv(`${prefix}_CLIENT_SECRET`, `${legacyPrefix}_CLIENT_SECRET`),
  };
}

function parseConfigJson(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  return {};
}

function fallbackRuntimeConfiguration(): PaymentRuntimeConfiguration {
  const environment = toEnvironment(process.env.PAYMENT_GATEWAY_ENV?.trim().toLowerCase());
  return {
    activeProvider: toProvider(process.env.PAYMENT_GATEWAY_PROVIDER?.trim().toLowerCase()),
    environment,
    subscriptionConfig: {},
    retryConfig: {},
    webhookMockSecret: process.env.PAYMENT_WEBHOOK_MOCK_SECRET?.trim() || "mock-webhook-secret",
    connectionStatus: "unknown",
    mercadoPagoCredentials: getMercadoPagoCredentials(environment),
  };
}

export async function getPaymentRuntimeConfiguration(preferredProvider?: ProviderName): Promise<PaymentRuntimeConfiguration> {
  const fallback = fallbackRuntimeConfiguration();

  if (!backendDatabase.enabled) {
    return {
      ...fallback,
      activeProvider: preferredProvider ?? fallback.activeProvider,
      connectionStatus: "not_connected",
      mercadoPagoCredentials: fallback.mercadoPagoCredentials,
    };
  }

  const appConfigResult = await backendDatabase.query<{ key: string; value: unknown }>(
    `
    SELECT key, value
    FROM app_config
    WHERE key IN (
      'payments.active_provider',
      'payments.environment',
      'payments.connection_status',
      'payments.webhook.mock_secret',
      'payments.subscriptions.config',
      'payments.retries.config'
    )
    `
  );

  const appConfig = new Map(appConfigResult.rows.map((row) => [row.key, row.value]));

  const configuredProvider = toProvider(String(appConfig.get("payments.active_provider") ?? "").trim().toLowerCase() || undefined);
  const configuredEnvironment = toEnvironment(String(appConfig.get("payments.environment") ?? "").trim().toLowerCase() || undefined);
  const resolvedProvider = preferredProvider ?? configuredProvider ?? fallback.activeProvider;

  const providerAccountResult = await backendDatabase.query<ProviderAccountRow>(
    `
    SELECT id, provider, environment, display_name, credentials_secret_ref, webhook_secret_ref, is_active
    FROM provider_accounts
    WHERE provider = $1
      AND environment = $2
      AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [resolvedProvider, configuredEnvironment]
  );

  const providerAccount = providerAccountResult.rows[0] ?? null;

  const settlementResult = providerAccount
    ? await backendDatabase.query<SettlementAccountRow>(
        `
        SELECT id, provider_account_id, country_code, currency, bank_name, account_alias, account_reference_secret_ref
        FROM provider_settlement_accounts
        WHERE provider_account_id = $1
          AND is_active = true
          AND (effective_to IS NULL OR effective_to > NOW())
        ORDER BY effective_from DESC
        LIMIT 1
        `,
        [providerAccount.id]
      )
    : { rows: [] as SettlementAccountRow[] };

  const connectionStatusRaw = String(appConfig.get("payments.connection_status") ?? "").trim().toLowerCase();
  const connectionStatus: PaymentRuntimeConfiguration["connectionStatus"] =
    connectionStatusRaw === "connected" || connectionStatusRaw === "degraded" || connectionStatusRaw === "not_connected"
      ? connectionStatusRaw
      : providerAccount
        ? "not_connected"
        : "unknown";

  const settlement = settlementResult.rows[0] ?? null;
  const mercadoPagoCredentials = resolvedProvider === "mercadopago" ? getMercadoPagoCredentials(configuredEnvironment) : undefined;

  return {
    activeProvider: providerAccount?.provider ?? resolvedProvider,
    environment: providerAccount?.environment ?? configuredEnvironment,
    providerAccountId: providerAccount?.id,
    providerDisplayName: providerAccount?.display_name,
    credentialsSecretRef: providerAccount?.credentials_secret_ref,
    webhookSecretRef: providerAccount?.webhook_secret_ref,
    webhookMockSecret:
      String(appConfig.get("payments.webhook.mock_secret") ?? "").trim() ||
      process.env.PAYMENT_WEBHOOK_MOCK_SECRET?.trim() ||
      "mock-webhook-secret",
    settlementAccount: settlement
      ? {
          id: settlement.id,
          countryCode: settlement.country_code,
          currency: settlement.currency,
          bankName: settlement.bank_name,
          accountAlias: settlement.account_alias,
          accountReferenceSecretRef: settlement.account_reference_secret_ref,
        }
      : undefined,
    subscriptionConfig: parseConfigJson(appConfig.get("payments.subscriptions.config")),
    retryConfig: parseConfigJson(appConfig.get("payments.retries.config")),
    connectionStatus,
    mercadoPagoCredentials,
  };
}
