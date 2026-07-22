import "server-only";

import { randomBytes, scryptSync } from "crypto";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import {
  COMMERCIAL_PLAN_ENTITLEMENTS,
  COMMERCIAL_PRODUCTS,
  type CommercialSubscriptionPlan,
  type CommercialProduct,
} from "@/app/lib/commercial/business-model";

type QueryParam = string | number | boolean | Date | null | string[];

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function buildPlanPermissions(plan: string) {
  switch (plan) {
    case "enterprise":
      return {
        alertas: true,
        bot: true,
        capital: true,
        fondeo: true,
        reportes: true,
        soporte: true,
        aiBriefing: true,
        maxAlerts: 1000,
        maxBots: 10,
      };
    case "premium":
      return {
        alertas: true,
        bot: true,
        capital: true,
        fondeo: false,
        reportes: true,
        soporte: true,
        aiBriefing: true,
        maxAlerts: 100,
        maxBots: 3,
      };
    case "pro":
      return {
        alertas: true,
        bot: true,
        capital: false,
        fondeo: false,
        reportes: true,
        soporte: true,
        aiBriefing: false,
        maxAlerts: 50,
        maxBots: 1,
      };
    default:
      return {
        alertas: true,
        bot: false,
        capital: false,
        fondeo: false,
        reportes: false,
        soporte: false,
        aiBriefing: false,
        maxAlerts: 5,
        maxBots: 0,
      };
  }
}

function resolveProductType(product: CommercialProduct): string {
  if (product.planCode === "basic") {
    return "plan_pro";
  }

  if (product.planCode === "pro") {
    return "plan_premium";
  }

  if (product.id === "bot-carvipix-license") {
    return "bot";
  }

  if (product.id === "socios-estrategicos") {
    return "strategic_partner";
  }

  if (product.id === "cuenta-fondeada") {
    return "fondeo";
  }

  if (product.id === "academia") {
    return "support";
  }

  return "product";
}

function resolveSubscriptionPlanCode(plan: CommercialSubscriptionPlan): string {
  if (plan === "advanced") {
    return "advanced";
  }

  if (plan === "basic") {
    return "basic";
  }

  return "free";
}

function hashAuthPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

class BackendDatabase {
  private readonly pool: Pool | null;
  private schemaReady: Promise<void> | null = null;

  constructor() {
    const connection = process.env.DATABASE_URL;
    if (!connection) {
      this.pool = null;
      return;
    }

    const useSsl = parseBoolean(process.env.DATABASE_SSL, false);

    this.pool = new Pool({
      connectionString: connection,
      max: Number(process.env.BACKEND_DB_POOL_MAX ?? 10),
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  get enabled(): boolean {
    return this.pool !== null;
  }

  async query<T extends QueryResultRow>(sql: string, params: QueryParam[] = []): Promise<QueryResult<T>> {
    if (!this.pool) {
      return { rows: [] as T[] } as QueryResult<T>;
    }

    await this.ensureSchema();
    return this.pool.query<T>(sql, params);
  }

  async withTransaction<T>(runner: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error("DATABASE_URL no configurado");
    }

    await this.ensureSchema();
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await runner(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureSchema(): Promise<void> {
    if (!this.pool) {
      return;
    }

    if (!this.schemaReady) {
      this.schemaReady = this.initializeSchema();
    }

    return this.schemaReady;
  }

  private async initializeSchema(): Promise<void> {
    if (!this.pool) {
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'demo',
        estado TEXT NOT NULL DEFAULT 'activo',
        fecha_activacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        fecha_vencimiento TIMESTAMPTZ,
        verificado BOOLEAN NOT NULL DEFAULT false
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pais TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'STANDARD';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'CLIENT';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS exclude_from_commercial_metrics BOOLEAN NOT NULL DEFAULT false;

      CREATE TABLE IF NOT EXISTS memberships (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activo',
        fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        fecha_fin TIMESTAMPTZ,
        renovacion_automatica BOOLEAN NOT NULL DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS plan_entitlements (
        plan TEXT PRIMARY KEY,
        alerts_enabled BOOLEAN NOT NULL,
        bot_enabled BOOLEAN NOT NULL,
        max_alerts_per_day INT NOT NULL,
        max_pairs INT NOT NULL,
        max_bots INT NOT NULL,
        history_limit INT NOT NULL DEFAULT 0,
        allowed_pairs JSONB NOT NULL DEFAULT 'null'::jsonb,
        trading_windows_utc JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS commercial_audit_events (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        actor_type TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        result TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS legal_documents (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        route TEXT NOT NULL,
        version TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        author TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('Activo', 'Borrador', 'Obsoleto')),
        related_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
        required_before_payment BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_legal_documents_slug_updated
      ON legal_documents(slug, updated_at DESC);

      CREATE TABLE IF NOT EXISTS legal_acceptances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_slug TEXT NOT NULL,
        document_version TEXT NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_slug_accepted_at
      ON legal_acceptances(user_id, document_slug, accepted_at DESC);

      CREATE TABLE IF NOT EXISTS compliance_videos (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL CHECK (scope IN ('public-home', 'member-dashboard')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        video_url TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_compliance_videos_scope_active
      ON compliance_videos(scope, active, updated_at DESC);

      CREATE TABLE IF NOT EXISTS capital_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_capital NUMERIC(14, 2) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'contract_sent', 'contract_signed', 'active', 'closed')),
        risk_profile TEXT NOT NULL,
        notes TEXT,
        contract_signed BOOLEAN NOT NULL DEFAULT false,
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        accepted_at TIMESTAMPTZ,
        rejected_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        message TEXT NOT NULL,
        admin_reply TEXT,
        responsible TEXT,
        conversation_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_ticket_events (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        actor_type TEXT NOT NULL,
        action TEXT NOT NULL,
        note TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategic_partner_applications (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        country TEXT NOT NULL,
        city TEXT NOT NULL,
        company_or_brand TEXT NOT NULL,
        main_activity TEXT NOT NULL,
        years_experience INT NOT NULL DEFAULT 0,
        profile_description TEXT NOT NULL,
        platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
        links JSONB NOT NULL DEFAULT '[]'::jsonb,
        followers_approx TEXT NOT NULL,
        primary_countries TEXT NOT NULL,
        community_type TEXT NOT NULL,
        motivation TEXT NOT NULL,
        contribution TEXT NOT NULL,
        presentation_strategy TEXT NOT NULL,
        confirm_true_info BOOLEAN NOT NULL,
        confirm_privacy BOOLEAN NOT NULL,
        confirm_non_guarantee BOOLEAN NOT NULL,
        confirm_contact_auth BOOLEAN NOT NULL,
        legal_disclaimer_ack BOOLEAN NOT NULL,
        legal_non_contract_ack BOOLEAN NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('new', 'in_review', 'info_required', 'approved_for_contact', 'rejected', 'archived')),
        assigned_admin TEXT,
        internal_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_strategic_partner_applications_status_created
      ON strategic_partner_applications(status, created_at DESC);

      CREATE TABLE IF NOT EXISTS strategic_partner_application_events (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES strategic_partner_applications(id) ON DELETE CASCADE,
        actor_type TEXT NOT NULL,
        action TEXT NOT NULL,
        note TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_strategic_partner_application_events_app_created
      ON strategic_partner_application_events(application_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket_created_at
      ON support_ticket_events(ticket_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS community_messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        content TEXT NOT NULL,
        parent_message_id TEXT,
        mentions JSONB NOT NULL DEFAULT '[]'::jsonb,
        read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
        edited_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        pinned_by TEXT,
        moderated BOOLEAN NOT NULL DEFAULT false,
        moderation_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_community_messages_channel_created_at
      ON community_messages(channel_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS community_message_reports (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        reported_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_community_reports_channel_created_at
      ON community_message_reports(channel_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS community_moderation_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_community_moderation_channel_created_at
      ON community_moderation_logs(channel_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS community_typing_presence (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_community_typing_presence_channel_expires
      ON community_typing_presence(channel_id, expires_at DESC);

      CREATE TABLE IF NOT EXISTS community_user_sanctions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT,
        sanction_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        expires_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_community_user_sanctions_user_active
      ON community_user_sanctions(user_id, active, created_at DESC);

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(14, 2) NOT NULL,
        currency TEXT NOT NULL,
        type TEXT NOT NULL,
        one_time BOOLEAN NOT NULL,
        features JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INT NOT NULL DEFAULT 1,
        total NUMERIC(14, 2) NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_id TEXT,
        fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        fecha_completado TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        amount NUMERIC(14, 2) NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        method TEXT,
        fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reference_id TEXT
      );

      CREATE TABLE IF NOT EXISTS provider_accounts (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
        display_name TEXT NOT NULL,
        credentials_secret_ref TEXT NOT NULL,
        webhook_secret_ref TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS provider_settlement_accounts (
        id TEXT PRIMARY KEY,
        provider_account_id TEXT NOT NULL REFERENCES provider_accounts(id) ON DELETE CASCADE,
        country_code CHAR(2) NOT NULL,
        currency CHAR(3) NOT NULL,
        bank_name TEXT NOT NULL,
        account_alias TEXT NOT NULL,
        account_reference_secret_ref TEXT NOT NULL,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (effective_to IS NULL OR effective_to > effective_from)
      );

      CREATE TABLE IF NOT EXISTS payment_orders (
        id TEXT PRIMARY KEY,
        external_order_code TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        order_status TEXT NOT NULL CHECK (order_status IN (
          'created',
          'pending_provider',
          'awaiting_confirmation',
          'paid',
          'failed',
          'cancelled',
          'refunded',
          'partially_refunded',
          'expired'
        )),
        amount_subtotal NUMERIC(14, 2) NOT NULL,
        amount_tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
        amount_total NUMERIC(14, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        payment_method_requested TEXT CHECK (payment_method_requested IN (
          'card_credit',
          'card_debit',
          'bank_transfer',
          'spei',
          'cash_voucher',
          'wallet',
          'other'
        )),
        provider_preferred TEXT CHECK (provider_preferred IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        idempotency_key TEXT NOT NULL,
        expires_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        payment_order_id TEXT NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
        provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        provider_account_id TEXT NOT NULL REFERENCES provider_accounts(id),
        provider_payment_id TEXT,
        provider_checkout_id TEXT,
        provider_customer_id TEXT,
        status TEXT NOT NULL CHECK (status IN (
          'initiated',
          'authorized',
          'captured',
          'settled',
          'failed',
          'refunded',
          'partially_refunded',
          'chargeback'
        )),
        amount_authorized NUMERIC(14, 2),
        amount_captured NUMERIC(14, 2),
        amount_refunded NUMERIC(14, 2) NOT NULL DEFAULT 0,
        currency CHAR(3) NOT NULL,
        payment_method TEXT CHECK (payment_method IN (
          'card_credit',
          'card_debit',
          'bank_transfer',
          'spei',
          'cash_voucher',
          'wallet',
          'other'
        )),
        authorized_at TIMESTAMPTZ,
        captured_at TIMESTAMPTZ,
        settled_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ,
        failure_code TEXT,
        failure_reason TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_attempts (
        id TEXT PRIMARY KEY,
        payment_transaction_id TEXT NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
        operation TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('started', 'succeeded', 'failed', 'timeout')),
        request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        http_status INT,
        latency_ms INT,
        error_message TEXT,
        retried_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        provider_account_id TEXT NOT NULL REFERENCES provider_accounts(id),
        provider_event_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_created_at TIMESTAMPTZ,
        signature_valid BOOLEAN NOT NULL DEFAULT false,
        process_status TEXT NOT NULL CHECK (process_status IN ('received', 'validated', 'ignored', 'processed', 'failed')),
        idempotency_fingerprint TEXT NOT NULL,
        payload JSONB NOT NULL,
        headers JSONB NOT NULL DEFAULT '{}'::jsonb,
        error_message TEXT,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS payment_refunds (
        id TEXT PRIMARY KEY,
        payment_transaction_id TEXT NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
        provider_refund_id TEXT,
        amount NUMERIC(14, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('requested', 'processing', 'succeeded', 'failed', 'cancelled')),
        reason TEXT,
        requested_by TEXT NOT NULL,
        requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS payment_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        provider_account_id TEXT NOT NULL REFERENCES provider_accounts(id),
        provider_subscription_id TEXT,
        status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
        billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
        amount NUMERIC(14, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        trial_ends_at TIMESTAMPTZ,
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        next_billing_at TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        cancelled_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_subscription_invoices (
        id TEXT PRIMARY KEY,
        payment_subscription_id TEXT NOT NULL REFERENCES payment_subscriptions(id) ON DELETE CASCADE,
        payment_order_id TEXT REFERENCES payment_orders(id) ON DELETE SET NULL,
        provider_invoice_id TEXT,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        amount_due NUMERIC(14, 2) NOT NULL,
        amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
        currency CHAR(3) NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open', 'paid', 'void', 'uncollectible')),
        due_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_timeline_events (
        id TEXT PRIMARY KEY,
        payment_order_id TEXT REFERENCES payment_orders(id) ON DELETE SET NULL,
        payment_transaction_id TEXT REFERENCES payment_transactions(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL CHECK (event_type IN (
          'order_created',
          'provider_session_created',
          'payment_authorized',
          'payment_captured',
          'payment_failed',
          'webhook_received',
          'webhook_processed',
          'refund_created',
          'refund_succeeded',
          'refund_failed',
          'subscription_created',
          'subscription_renewed',
          'membership_activated',
          'membership_deactivated',
          'email_sent',
          'email_failed'
        )),
        event_source TEXT NOT NULL CHECK (event_source IN ('system', 'provider_webhook', 'admin', 'scheduler')),
        event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        correlation_id TEXT,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        actor TEXT
      );

      CREATE TABLE IF NOT EXISTS payment_outbox_events (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
        attempts INT NOT NULL DEFAULT 0,
        available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS billing_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        legal_name TEXT NOT NULL,
        tax_id TEXT,
        tax_country CHAR(2),
        tax_regime TEXT,
        fiscal_email TEXT,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country_code CHAR(2),
        is_default BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payment_method_references (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'openpay', 'custom')),
        provider_payment_method_id TEXT,
        token_reference TEXT NOT NULL,
        brand TEXT,
        last4 CHAR(4),
        exp_month SMALLINT,
        exp_year SMALLINT,
        alias TEXT,
        payment_type TEXT CHECK (payment_type IN ('card_credit', 'card_debit', 'bank_transfer', 'spei', 'cash_voucher', 'wallet', 'other')),
        is_default BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
        billing_profile_id TEXT REFERENCES billing_profiles(id) ON DELETE SET NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS source TEXT;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS payment_subscription_id TEXT;
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS capital_accounts (
        account_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        initial_capital NUMERIC(14, 2) NOT NULL,
        current_balance NUMERIC(14, 2) NOT NULL,
        utilidad NUMERIC(14, 2) NOT NULL,
        participacion_cliente NUMERIC(14, 2) NOT NULL,
        participacion_carvipix NUMERIC(14, 2) NOT NULL,
        status TEXT NOT NULL,
        fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        monthly_return NUMERIC(8, 4) NOT NULL DEFAULT 0,
        annual_return NUMERIC(8, 4) NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS capital_movements (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES capital_accounts(account_id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount NUMERIC(14, 2) NOT NULL,
        fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL,
        balance_after NUMERIC(14, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS monthly_reports (
        id BIGSERIAL PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES capital_accounts(account_id) ON DELETE CASCADE,
        mes TEXT NOT NULL,
        capital_inicial NUMERIC(14, 2) NOT NULL,
        capital_final NUMERIC(14, 2) NOT NULL,
        utilidad NUMERIC(14, 2) NOT NULL,
        participacion_cliente NUMERIC(14, 2) NOT NULL,
        participacion_carvipix NUMERIC(14, 2) NOT NULL,
        rendimiento NUMERIC(8, 4) NOT NULL,
        UNIQUE (account_id, mes)
      );

      CREATE TABLE IF NOT EXISTS operations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_id TEXT REFERENCES capital_accounts(account_id) ON DELETE SET NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        status TEXT NOT NULL,
        pnl NUMERIC(14, 2) NOT NULL DEFAULT 0,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS real_signal_lifecycle (
        signal_id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decision TEXT NOT NULL,
        entry_price NUMERIC(18, 8),
        stop_loss NUMERIC(18, 8),
        take_profit NUMERIC(18, 8),
        strategy_id TEXT NOT NULL,
        signal_status TEXT NOT NULL,
        source TEXT NOT NULL,
        data_origin TEXT NOT NULL,
        tracking_account TEXT NOT NULL,
        classification TEXT NOT NULL DEFAULT 'REAL_SIGNAL_RESULT',
        signal_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        activated_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (analysis_id),
        CHECK (classification = 'REAL_SIGNAL_RESULT')
      );

      CREATE TABLE IF NOT EXISTS telegram_delivery_ledger (
        delivery_id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        signal_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decision TEXT NOT NULL,
        classification TEXT NOT NULL,
        delivery_state TEXT NOT NULL,
        destination_mode TEXT NOT NULL,
        channel_id TEXT,
        message_id TEXT,
        reason TEXT NOT NULL,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (classification IN ('OFFICIAL_ALERT', 'GLOBAL_SUMMARY')),
        CHECK (delivery_state IN ('SENT', 'SKIPPED', 'FAILED')),
        CHECK (destination_mode IN ('OFFICIAL', 'TEST_ONLY'))
      );

      CREATE INDEX IF NOT EXISTS telegram_delivery_ledger_signal_idx
        ON telegram_delivery_ledger (signal_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS telegram_delivery_ledger_analysis_idx
        ON telegram_delivery_ledger (analysis_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS probabilistic_simulation_runs (
        run_id TEXT PRIMARY KEY,
        methodology_version TEXT NOT NULL,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        data_source TEXT NOT NULL,
        data_hash TEXT NOT NULL,
        seed TEXT NOT NULL,
        iterations INTEGER NOT NULL CHECK (iterations > 0),
        assumptions JSONB NOT NULL,
        limitations JSONB NOT NULL,
        metrics JSONB NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (period_end > period_start)
      );

      CREATE TABLE IF NOT EXISTS probabilistic_simulation_scenarios (
        scenario_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES probabilistic_simulation_runs(run_id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
        source_type TEXT NOT NULL CHECK (source_type IN ('DOCUMENTED_MODEL', 'RECORDED_ANALYSIS')),
        activation_probability NUMERIC(10, 8) NOT NULL CHECK (activation_probability BETWEEN 0 AND 1),
        success_probability NUMERIC(10, 8) NOT NULL CHECK (success_probability BETWEEN 0 AND 1),
        risk_reward NUMERIC(12, 4) NOT NULL,
        risk_pips NUMERIC(14, 4) NOT NULL,
        spread_pips NUMERIC(14, 6) NOT NULL,
        commission_pips NUMERIC(14, 6) NOT NULL,
        slippage_pips NUMERIC(14, 6) NOT NULL,
        observed_outcome TEXT CHECK (observed_outcome IN ('TP', 'SL', 'NOT_ACTIVATED')),
        observed_signal_id TEXT UNIQUE,
        occurred_at TIMESTAMPTZ NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        UNIQUE (run_id, symbol, occurred_at)
      );

      CREATE TABLE IF NOT EXISTS probabilistic_profiles (
        profile_id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES probabilistic_simulation_runs(run_id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        avatar_key TEXT NOT NULL,
        risk_type TEXT NOT NULL CHECK (risk_type IN ('CONSERVATIVE', 'MODERATE', 'DYNAMIC')),
        initial_balance NUMERIC(14, 2) NOT NULL,
        current_balance NUMERIC(14, 2) NOT NULL,
        peak_balance NUMERIC(14, 2) NOT NULL,
        max_drawdown_pct NUMERIC(10, 4) NOT NULL DEFAULT 0,
        weekly_result NUMERIC(14, 2) NOT NULL DEFAULT 0,
        monthly_result NUMERIC(14, 2) NOT NULL DEFAULT 0,
        operations_applied INTEGER NOT NULL DEFAULT 0,
        is_real_user BOOLEAN NOT NULL DEFAULT false CHECK (is_real_user = false),
        profile_type TEXT NOT NULL DEFAULT 'PROBABILISTIC_SIMULATION' CHECK (profile_type = 'PROBABILISTIC_SIMULATION'),
        exclude_from_members BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_members = true),
        exclude_from_revenue BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_revenue = true),
        exclude_from_live_users BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_live_users = true),
        exclude_from_testimonials BOOLEAN NOT NULL DEFAULT true CHECK (exclude_from_testimonials = true),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS probabilistic_profile_events (
        event_id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
        signal_id TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK (source_type IN ('SIMULATED_SCENARIO', 'OBSERVED_OFFICIAL_CLOSURE')),
        outcome TEXT NOT NULL CHECK (outcome IN ('TP', 'SL', 'NOT_ACTIVATED', 'CLOSED')),
        balance_before NUMERIC(14, 2) NOT NULL,
        balance_after NUMERIC(14, 2) NOT NULL,
        pnl NUMERIC(14, 2) NOT NULL,
        drawdown_pct NUMERIC(10, 4) NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (profile_id, signal_id)
      );

      CREATE TABLE IF NOT EXISTS probabilistic_profile_balances (
        profile_id TEXT NOT NULL REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
        sequence_no INTEGER NOT NULL,
        balance NUMERIC(14, 2) NOT NULL,
        drawdown_pct NUMERIC(10, 4) NOT NULL,
        recorded_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (profile_id, sequence_no)
      );

      CREATE TABLE IF NOT EXISTS probabilistic_bot_profiles (
        profile_id TEXT PRIMARY KEY REFERENCES probabilistic_profiles(profile_id) ON DELETE CASCADE,
        selection_rank INTEGER NOT NULL,
        signals_processed INTEGER NOT NULL DEFAULT 0,
        performance_by_asset JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alert_performance_metrics (
        signal_id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
        outcome TEXT NOT NULL CHECK (outcome IN ('TP', 'SL', 'CANCELLED', 'EXPIRED', 'NOT_ACTIVATED', 'CLOSED')),
        net_pips NUMERIC(14, 4) NOT NULL DEFAULT 0,
        risk_reward NUMERIC(12, 4),
        activated BOOLEAN NOT NULL,
        closed_at TIMESTAMPTZ NOT NULL,
        source TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS results_activity_feed (
        activity_id TEXT PRIMARY KEY,
        activity_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (activity_type, source_id)
      );

      CREATE INDEX IF NOT EXISTS probabilistic_scenarios_run_time_idx ON probabilistic_simulation_scenarios(run_id, occurred_at);
      CREATE INDEX IF NOT EXISTS probabilistic_profiles_run_risk_idx ON probabilistic_profiles(run_id, risk_type);
      CREATE INDEX IF NOT EXISTS probabilistic_profile_events_signal_idx ON probabilistic_profile_events(signal_id);
      CREATE INDEX IF NOT EXISTS alert_performance_closed_idx ON alert_performance_metrics(closed_at DESC);
      CREATE INDEX IF NOT EXISTS results_activity_occurred_idx ON results_activity_feed(occurred_at DESC);

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        condition TEXT NOT NULL,
        symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
        alert_types JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alert_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        alert_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_licenses (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        license_key TEXT NOT NULL,
        purchase_date TIMESTAMPTZ NOT NULL,
        expiry_date TIMESTAMPTZ,
        active BOOLEAN NOT NULL DEFAULT false,
        broker_connected TEXT
      );

      CREATE TABLE IF NOT EXISTS bot_instances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        strategy TEXT NOT NULL,
        status TEXT NOT NULL,
        symbol TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        stats JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS bot_connection_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bot_instance_id TEXT NOT NULL REFERENCES bot_instances(id) ON DELETE CASCADE,
        broker_type TEXT NOT NULL CHECK (broker_type IN ('MT4', 'MT5')),
        server TEXT NOT NULL,
        login TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('demo', 'real')),
        connection_status TEXT NOT NULL CHECK (connection_status IN ('disconnected', 'connected', 'degraded', 'error')),
        credentials_hash TEXT NOT NULL,
        last_synced_at TIMESTAMPTZ,
        heartbeat_at TIMESTAMPTZ,
        reconnect_attempts INT NOT NULL DEFAULT 0,
        diagnostic_summary TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_event_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bot_instance_id TEXT REFERENCES bot_instances(id) ON DELETE CASCADE,
        level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
        event_type TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_updates (
        version TEXT PRIMARY KEY,
        release_date TIMESTAMPTZ NOT NULL,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
        bug_fixes JSONB NOT NULL DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
      ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS device_label TEXT;

      CREATE TABLE IF NOT EXISTS auth_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_market_ticks (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        bid NUMERIC(18, 8) NOT NULL,
        ask NUMERIC(18, 8) NOT NULL,
        spread NUMERIC(18, 8) NOT NULL,
        mid_price NUMERIC(18, 8) NOT NULL,
        source TEXT NOT NULL,
        tick_time TIMESTAMPTZ NOT NULL,
        ingest_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        CHECK (ask >= bid)
      );

      CREATE TABLE IF NOT EXISTS ie_candles (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        open_time TIMESTAMPTZ NOT NULL,
        close_time TIMESTAMPTZ NOT NULL,
        open NUMERIC(18, 8) NOT NULL,
        high NUMERIC(18, 8) NOT NULL,
        low NUMERIC(18, 8) NOT NULL,
        close NUMERIC(18, 8) NOT NULL,
        volume NUMERIC(24, 8) NOT NULL DEFAULT 0,
        spread_min NUMERIC(18, 8),
        spread_max NUMERIC(18, 8),
        spread_avg NUMERIC(18, 8),
        source TEXT NOT NULL,
        ingest_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (high >= low),
        CHECK (close_time > open_time)
      );

      CREATE TABLE IF NOT EXISTS ie_economic_news (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        event_id TEXT,
        title TEXT NOT NULL,
        country_code CHAR(2),
        currency CHAR(3),
        impact TEXT,
        actual_value TEXT,
        forecast_value TEXT,
        previous_value TEXT,
        published_at TIMESTAMPTZ NOT NULL,
        event_time TIMESTAMPTZ,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        ingest_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_system_logs (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context JSONB NOT NULL DEFAULT '{}'::jsonb,
        trace_id TEXT,
        logged_at TIMESTAMPTZ NOT NULL,
        ingest_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_data_quality_reports (
        id TEXT PRIMARY KEY,
        dataset TEXT NOT NULL,
        symbol TEXT,
        timeframe TEXT,
        date_from TIMESTAMPTZ,
        date_to TIMESTAMPTZ,
        total_rows BIGINT NOT NULL DEFAULT 0,
        missing_rows BIGINT NOT NULL DEFAULT 0,
        duplicate_rows BIGINT NOT NULL DEFAULT 0,
        invalid_rows BIGINT NOT NULL DEFAULT 0,
        latency_ms_p95 INT,
        score NUMERIC(6, 3),
        status TEXT NOT NULL,
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        generated_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_engine_decisions (
        id TEXT PRIMARY KEY,
        decision_type TEXT NOT NULL,
        symbol TEXT,
        timeframe TEXT,
        decided_at TIMESTAMPTZ NOT NULL,
        state TEXT NOT NULL,
        rationale TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_operation_results (
        id TEXT PRIMARY KEY,
        decision_id TEXT REFERENCES ie_engine_decisions(id) ON DELETE SET NULL,
        symbol TEXT,
        timeframe TEXT,
        side TEXT,
        status TEXT NOT NULL,
        entry_price NUMERIC(18, 8),
        exit_price NUMERIC(18, 8),
        stop_loss NUMERIC(18, 8),
        take_profit NUMERIC(18, 8),
        quantity NUMERIC(24, 8),
        pnl NUMERIC(24, 8),
        executed_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ie_system_versions (
        id TEXT PRIMARY KEY,
        component TEXT NOT NULL,
        version TEXT NOT NULL,
        build_hash TEXT,
        release_channel TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        deployed_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_licenses (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL UNIQUE,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        activated_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        max_installations INT NOT NULL DEFAULT 1,
        subscription_tier TEXT NOT NULL DEFAULT 'BASIC' CHECK (subscription_tier IN ('BASIC', 'PRO', 'ENTERPRISE'))
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_installations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_id TEXT NOT NULL,
        installation_id TEXT NOT NULL,
        account_hash TEXT NOT NULL,
        account_number BIGINT NOT NULL,
        broker_server TEXT NOT NULL,
        magic_number INT NOT NULL,
        ea_version TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('VALIDATING', 'ACTIVE', 'READ_ONLY', 'SUSPENDED', 'ERROR')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_heartbeat TIMESTAMPTZ,
        is_revoked BOOLEAN NOT NULL DEFAULT false,
        max_open_trades INT NOT NULL DEFAULT 3,
        max_daily_trades INT NOT NULL DEFAULT 10,
        max_daily_loss_percent NUMERIC(6, 2) NOT NULL DEFAULT 5.0,
        UNIQUE (license_id, installation_id)
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_signals (
        id TEXT PRIMARY KEY,
        signal_id TEXT NOT NULL UNIQUE,
        analysis_id TEXT NOT NULL,
        license_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('BUY', 'SELL', 'NONE')),
        entry NUMERIC(18, 8) NOT NULL,
        stop_loss NUMERIC(18, 8) NOT NULL,
        take_profit NUMERIC(18, 8) NOT NULL,
        risk_reward NUMERIC(10, 2),
        signature TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        delivered_at TIMESTAMPTZ,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'DELIVERED', 'EXECUTED', 'EXPIRED', 'REJECTED')),
        CONSTRAINT valid_entry_levels CHECK (take_profit > entry AND entry > stop_loss)
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_executions (
        id TEXT PRIMARY KEY,
        signal_id TEXT NOT NULL REFERENCES bot_mt5_signals(signal_id) ON DELETE CASCADE,
        license_id TEXT NOT NULL,
        installation_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
        requested_entry NUMERIC(18, 8) NOT NULL,
        executed_entry NUMERIC(18, 8),
        stop_loss NUMERIC(18, 8) NOT NULL,
        take_profit NUMERIC(18, 8) NOT NULL,
        lot_size NUMERIC(24, 8) NOT NULL,
        magic_number INT NOT NULL,
        broker_order_id BIGINT,
        broker_server_response TEXT,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'EXECUTED', 'FAILED', 'CLOSED')),
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        closed_at TIMESTAMPTZ,
        exit_price NUMERIC(18, 8),
        gross_pnl NUMERIC(24, 8),
        net_pnl NUMERIC(24, 8),
        commission NUMERIC(18, 8),
        swap NUMERIC(18, 8),
        slippage NUMERIC(18, 8),
        error_code TEXT,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_heartbeats (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        installation_id TEXT NOT NULL,
        ea_version TEXT NOT NULL,
        status TEXT NOT NULL,
        open_positions INT NOT NULL DEFAULT 0,
        equity NUMERIC(24, 8),
        balance NUMERIC(24, 8),
        account_hash TEXT NOT NULL,
        broker_server TEXT NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bot_mt5_downloads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_id TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        download_token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        downloaded_at TIMESTAMPTZ,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_memberships_plan_estado
        ON memberships(plan, estado);

      CREATE INDEX IF NOT EXISTS idx_capital_accounts_user_status
        ON capital_accounts(user_id, status);

      CREATE INDEX IF NOT EXISTS idx_capital_movements_account_fecha
        ON capital_movements(account_id, fecha DESC);

      CREATE INDEX IF NOT EXISTS idx_operations_user_executed
        ON operations(user_id, executed_at DESC);

      CREATE INDEX IF NOT EXISTS idx_operations_account_executed
        ON operations(account_id, executed_at DESC);

      CREATE INDEX IF NOT EXISTS idx_real_signal_lifecycle_symbol_time
        ON real_signal_lifecycle(symbol, signal_timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_real_signal_lifecycle_status
        ON real_signal_lifecycle(signal_status, signal_timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_real_signal_lifecycle_decision
        ON real_signal_lifecycle(decision, signal_timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
        ON auth_sessions(user_id, expires_at DESC);

      CREATE INDEX IF NOT EXISTS idx_auth_verify_user
        ON auth_verification_tokens(user_id, expires_at DESC);

      CREATE INDEX IF NOT EXISTS idx_auth_reset_user
        ON auth_password_reset_tokens(user_id, expires_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_provider_accounts_active_env
        ON provider_accounts(provider, environment)
        WHERE is_active = true;

      CREATE INDEX IF NOT EXISTS idx_provider_settlement_accounts_active
        ON provider_settlement_accounts(provider_account_id, is_active, effective_from DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_orders_idempotency
        ON payment_orders(user_id, idempotency_key);

      CREATE INDEX IF NOT EXISTS idx_payment_orders_user_status
        ON payment_orders(user_id, order_status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created
        ON payment_orders(order_status, created_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_transactions_provider_payment
        ON payment_transactions(provider, provider_payment_id)
        WHERE provider_payment_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_payment_transactions_order
        ON payment_transactions(payment_order_id);

      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
        ON payment_transactions(status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_attempts_tx_created
        ON payment_attempts(payment_transaction_id, created_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_webhook_provider_event
        ON payment_webhook_events(provider, provider_event_id);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_webhook_fingerprint
        ON payment_webhook_events(idempotency_fingerprint);

      CREATE INDEX IF NOT EXISTS idx_webhook_process_status
        ON payment_webhook_events(process_status, first_seen_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_refunds_tx
        ON payment_refunds(payment_transaction_id, requested_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_subscriptions_provider_id
        ON payment_subscriptions(provider, provider_subscription_id)
        WHERE provider_subscription_id IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_user_status
        ON payment_subscriptions(user_id, status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_subscription_invoices_sub
        ON payment_subscription_invoices(payment_subscription_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_timeline_order
        ON payment_timeline_events(payment_order_id, occurred_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_timeline_tx
        ON payment_timeline_events(payment_transaction_id, occurred_at DESC);

      CREATE INDEX IF NOT EXISTS idx_payment_outbox_status_available
        ON payment_outbox_events(status, available_at);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_outbox_email_dedupe
        ON payment_outbox_events(event_name, (payload->>'dedupeKey'))
        WHERE event_name = 'email.transactional.requested';

      CREATE INDEX IF NOT EXISTS idx_billing_profiles_user
        ON billing_profiles(user_id, created_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_profiles_default_per_user
        ON billing_profiles(user_id)
        WHERE is_default = true;

      CREATE INDEX IF NOT EXISTS idx_payment_method_references_user
        ON payment_method_references(user_id, status, created_at DESC);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_method_refs_default_active_per_user
        ON payment_method_references(user_id)
        WHERE is_default = true AND status = 'active';

      CREATE UNIQUE INDEX IF NOT EXISTS ux_ie_candles_symbol_tf_open
        ON ie_candles(symbol, timeframe, open_time);

      CREATE INDEX IF NOT EXISTS idx_ie_candles_symbol_open
        ON ie_candles(symbol, open_time DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_candles_timeframe_open
        ON ie_candles(timeframe, open_time DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_candles_open_time_brin
        ON ie_candles USING BRIN(open_time);

      CREATE INDEX IF NOT EXISTS idx_ie_market_ticks_symbol_time
        ON ie_market_ticks(symbol, tick_time DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_market_ticks_time_brin
        ON ie_market_ticks USING BRIN(tick_time);

      CREATE INDEX IF NOT EXISTS idx_ie_market_ticks_spread_time
        ON ie_market_ticks(symbol, spread, tick_time DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_news_published
        ON ie_economic_news(published_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_news_country_currency
        ON ie_economic_news(country_code, currency, published_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_logs_module_time
        ON ie_system_logs(module, logged_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_logs_level_time
        ON ie_system_logs(level, logged_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_dq_dataset_generated
        ON ie_data_quality_reports(dataset, generated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_decisions_symbol_time
        ON ie_engine_decisions(symbol, decided_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ie_results_symbol_exec
        ON ie_operation_results(symbol, executed_at DESC);

      CREATE INDEX IF NOT EXISTS idx_bot_mt5_licenses_license_id
        ON bot_mt5_licenses(license_id);

      CREATE INDEX IF NOT EXISTS idx_bot_mt5_licenses_status
        ON bot_mt5_licenses(status);

      CREATE UNIQUE INDEX IF NOT EXISTS ux_ie_versions_component_version
        ON ie_system_versions(component, version);
    `);

    await this.seedBaseData();
  }

  private async seedBaseData(): Promise<void> {
    if (!this.pool) {
      return;
    }

    const defaultUserId = process.env.BACKEND_DEFAULT_USER_ID ?? "user-001";
    const defaultPlan = process.env.BACKEND_DEFAULT_USER_PLAN ?? "pro";
    const permissions = buildPlanPermissions(defaultPlan);

    const founderEmail = String(process.env.FOUNDER_EMAIL ?? "fundador.uat@carvipix.local").trim().toLowerCase();
    const founderFirstName = String(process.env.FOUNDER_FIRST_NAME ?? "Daniel").trim() || "Daniel";
    const founderLastName = String(process.env.FOUNDER_LAST_NAME ?? "Ortega").trim() || "Ortega";
    const founderPhone = String(process.env.FOUNDER_PHONE ?? "5512345678").trim() || "5512345678";
    const founderCountry = String(process.env.FOUNDER_COUNTRY ?? "MX").trim() || "MX";
    const founderId = String(process.env.FOUNDER_USER_ID ?? "founder-client").trim() || "founder-client";
    const founderPasswordHash = String(process.env.FOUNDER_PASSWORD_HASH ?? "").trim();
    const founderPassword = String(process.env.FOUNDER_PASSWORD ?? "").trim();
    const resolvedFounderPasswordHash = founderPasswordHash || (founderPassword ? hashAuthPassword(founderPassword) : "");

    await this.pool.query(
      `
      INSERT INTO users (id, email, nombre, apellido, plan, estado, verificado, user_type, user_role, exclude_from_commercial_metrics)
      VALUES ($1, $2, $3, $4, $5, 'activo', true, 'STANDARD', 'CLIENT', false)
      ON CONFLICT (id) DO NOTHING
      `,
      [defaultUserId, "operaciones@carvipix.com", "Cuenta", "Operativa", defaultPlan]
    );

    await this.pool.query(
      `
      UPDATE users
      SET user_type = COALESCE(NULLIF(user_type, ''), 'STANDARD'),
          user_role = COALESCE(NULLIF(user_role, ''), 'CLIENT'),
          exclude_from_commercial_metrics = COALESCE(exclude_from_commercial_metrics, false)
      WHERE id = $1
      `,
      [defaultUserId]
    );

    await this.pool.query(
      `
      INSERT INTO memberships (user_id, plan, estado, renovacion_automatica)
      VALUES ($1, $2, 'activo', true)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [defaultUserId, defaultPlan]
    );

    await this.pool.query(
      `
      INSERT INTO app_config (key, value)
      VALUES
        ('backend.permissions', $1::jsonb),
        ('backend.initialized', '{"ok": true}'::jsonb)
      ON CONFLICT (key) DO NOTHING
      `,
      [JSON.stringify(permissions)]
    );

    await this.pool.query(`
      INSERT INTO plan_entitlements (plan, alerts_enabled, bot_enabled, max_alerts_per_day, max_pairs, max_bots, history_limit, allowed_pairs, trading_windows_utc)
      VALUES
        ('free', false, false, 0, 1, 0, 3, '["EURUSD"]'::jsonb, '[]'::jsonb),
        ('basic', true, true, 5, 2, 1, 25, '["XAUUSD","BTCUSD"]'::jsonb, '[{"startHourUtc":7,"endHourUtc":16},{"startHourUtc":18,"endHourUtc":21}]'::jsonb),
        ('advanced', true, true, 14, 50, 3, 180, 'null'::jsonb, '[{"startHourUtc":0,"endHourUtc":23}]'::jsonb)
      ON CONFLICT (plan) DO NOTHING
    `);

    for (const plan of ["free", "basic", "advanced"] as const) {
      const entitlements = COMMERCIAL_PLAN_ENTITLEMENTS[plan];
      await this.pool.query(
        `
        UPDATE plan_entitlements
        SET alerts_enabled = $2,
            bot_enabled = $3,
            max_alerts_per_day = $4,
            max_pairs = $5,
            max_bots = $6,
            history_limit = $7,
            allowed_pairs = $8::jsonb,
            trading_windows_utc = $9::jsonb
        WHERE plan = $1
        `,
        [
          plan,
          entitlements.alertsEnabled,
          entitlements.botEnabled,
          entitlements.maxAlertsPerDay,
          entitlements.maxPairs,
          entitlements.maxBots,
          entitlements.historyLimit,
          JSON.stringify(entitlements.allowedPairs),
          JSON.stringify(entitlements.tradingWindowsUtc),
        ]
      );
    }

    const seedProducts = COMMERCIAL_PRODUCTS.filter((product) => product.id !== "plan-free");

    if (resolvedFounderPasswordHash) {
      const founderInsert = await this.pool.query<{ id: string }>(
        `
        INSERT INTO users (
          id,
          email,
          nombre,
          apellido,
          plan,
          estado,
          fecha_vencimiento,
          verificado,
          password_hash,
          telefono,
          pais,
          user_type,
          user_role,
          exclude_from_commercial_metrics
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'pro',
          'activo',
          NULL,
          true,
          $5,
          $6,
          $7,
          'FOUNDER',
          'CLIENT',
          true
        )
        ON CONFLICT (email)
        DO UPDATE SET
          plan = 'pro',
          estado = 'activo',
          fecha_vencimiento = NULL,
          verificado = true,
          password_hash = COALESCE(NULLIF($5, ''), users.password_hash),
          telefono = COALESCE(NULLIF($6, ''), users.telefono),
          pais = COALESCE(NULLIF($7, ''), users.pais),
          user_type = 'FOUNDER',
          user_role = 'CLIENT',
          exclude_from_commercial_metrics = true
        RETURNING id
        `,
        [founderId, founderEmail, founderFirstName, founderLastName, resolvedFounderPasswordHash, founderPhone, founderCountry]
      );

      const founderUserId = founderInsert.rows[0]?.id;
      if (founderUserId) {
        await this.pool.query(
          `
          INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica)
          VALUES ($1, 'pro', 'activo', NOW(), NULL, false)
          ON CONFLICT (user_id)
          DO UPDATE SET
            plan = 'pro',
            estado = 'activo',
            fecha_fin = NULL,
            renovacion_automatica = false
          `,
          [founderUserId]
        );

        await this.pool.query(
          `
          INSERT INTO bot_licenses (user_id, license_key, purchase_date, expiry_date, active, broker_connected)
          VALUES ($1, $2, NOW(), NULL, true, NULL)
          ON CONFLICT (user_id)
          DO UPDATE SET
            active = true,
            expiry_date = NULL
          `,
          [founderUserId, `FOUNDER-BOT-LIFETIME-${founderUserId.toUpperCase()}`]
        );
      }
    }

    for (const product of seedProducts) {
      const dbType = resolveProductType(product);
      const oneTime = product.billingType === "one_time";
      const price = Number(product.priceUsd ?? 0);

      await this.pool.query(
        `
        INSERT INTO products (id, name, description, price, currency, type, one_time, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        ON CONFLICT (id) DO NOTHING
        `,
        [
          product.id,
          product.name,
          product.description,
          price,
          product.currency,
          dbType,
          oneTime,
          JSON.stringify(product.features),
        ]
      );

      await this.pool.query(
        `
        UPDATE products
        SET name = $2,
            description = $3,
            price = $4,
            currency = $5,
            type = $6,
            one_time = $7,
            features = $8::jsonb
        WHERE id = $1
        `,
        [
          product.id,
          product.name,
          product.description,
          price,
          product.currency,
          dbType,
          oneTime,
          JSON.stringify(product.features),
        ]
      );
    }

    await this.pool.query(`
      DELETE FROM products
      WHERE id IN ('plan-pro', 'plan-premium');
    `);
  }
}

export const backendDatabase = new BackendDatabase();
