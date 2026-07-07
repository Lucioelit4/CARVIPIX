import "server-only";

import type {
  CanonicalPaymentStatus,
  CanonicalWebhookEvent,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  ParseWebhookInput,
  ProviderPaymentAdapter,
  VerifyWebhookInput,
} from "./contracts";
import type { ProviderName } from "./types";
import {
  buildMockCheckoutSession,
  parseMockWebhookEvent,
  resolveEffectiveProvider,
  verifyMockWebhookSignature,
} from "./provider-adapter-logic";
import { getPaymentRuntimeConfiguration } from "./provider-config";

class PlaceholderAdapter implements ProviderPaymentAdapter {
  constructor(public readonly provider: ProviderName) {}

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
    const runtimeConfig = await getPaymentRuntimeConfiguration(this.provider);
    const provider = resolveEffectiveProvider({
      preferredProvider: this.provider,
      runtimeActiveProvider: runtimeConfig.activeProvider,
      envProvider: process.env.PAYMENT_GATEWAY_PROVIDER?.trim().toLowerCase(),
    });

    const session = buildMockCheckoutSession({
      provider,
      orderId: input.orderId,
      returnUrl: input.returnUrl,
    });

    return {
      provider,
      providerCheckoutId: session.providerCheckoutId,
      checkoutUrl: session.checkoutUrl,
      expiresAt: session.expiresAt,
      raw: {
        ...session.raw,
        runtime: {
          providerAccountId: runtimeConfig.providerAccountId ?? null,
          environment: runtimeConfig.environment,
          connectionStatus: runtimeConfig.connectionStatus,
          settlementAccount: runtimeConfig.settlementAccount ?? null,
          subscriptions: runtimeConfig.subscriptionConfig,
          retries: runtimeConfig.retryConfig,
        },
      },
    };
  }

  async verifyWebhookSignature(input: VerifyWebhookInput): Promise<boolean> {
    const runtimeConfig = await getPaymentRuntimeConfiguration(this.provider);
    const webhookSecret = runtimeConfig.webhookMockSecret ?? "mock-webhook-secret";

    return verifyMockWebhookSignature({
      payloadRaw: input.payloadRaw,
      headers: input.headers,
      webhookSecret,
    });
  }

  async parseWebhookEvent(input: ParseWebhookInput): Promise<CanonicalWebhookEvent> {
    return parseMockWebhookEvent({ payloadRaw: input.payloadRaw });
  }

  async getPaymentStatus(_providerPaymentId: string): Promise<CanonicalPaymentStatus> {
    throw new Error("Payment status sync must be implemented in provider adapters during Phase 3.");
  }
}

export function resolveProviderAdapter(provider?: ProviderName): ProviderPaymentAdapter {
  const resolved = resolveEffectiveProvider({
    preferredProvider: provider,
    envProvider: process.env.PAYMENT_GATEWAY_PROVIDER?.trim().toLowerCase(),
  });

  return new PlaceholderAdapter(resolved);
}
