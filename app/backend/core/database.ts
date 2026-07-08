import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

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

      CREATE TABLE IF NOT EXISTS memberships (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activo',
        fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        fecha_fin TIMESTAMPTZ,
        renovacion_automatica BOOLEAN NOT NULL DEFAULT false
      );

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

    await this.pool.query(
      `
      INSERT INTO users (id, email, nombre, apellido, plan, estado, verificado)
      VALUES ($1, $2, $3, $4, $5, 'activo', true)
      ON CONFLICT (id) DO NOTHING
      `,
      [defaultUserId, "operaciones@carvipix.com", "Cuenta", "Operativa", defaultPlan]
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
      INSERT INTO products (id, name, description, price, currency, type, one_time, features)
      VALUES
        ('bot-carvipix-license', 'Bot CARVIPIX', 'Licencia de por vida para Bot CARVIPIX', 999, 'USD', 'bot', true, '["Ejecucion automatica de reglas","Control de riesgo","MT4/MT5 compatible","Actualizaciones futuras"]'::jsonb),
        ('capital-gestionado', 'Gestion de Capital', 'Gestion institucional de capital', 10000, 'USD', 'capital', false, '["Capital objetivo 10K-1M USD","Reportes mensuales","Soporte dedicado"]'::jsonb),
        ('cuenta-fondeada', 'Cuenta Fondeada', 'Servicio de gestion de fondeo', 5000, 'USD', 'fondeo', true, '["Capital objetivo 200K USD","30-45 dias","Credenciales al completar"]'::jsonb),
        ('plan-pro', 'Plan Pro', 'Plan mensual con acceso operativo', 49, 'USD', 'plan_pro', false, '["50 alertas","1 bot","Reportes"]'::jsonb),
        ('plan-premium', 'Plan Premium', 'Plan mensual con acceso completo', 199, 'USD', 'plan_premium', false, '["Alertas ilimitadas","3 bots","Capital gestionado","IA Briefing"]'::jsonb)
      ON CONFLICT (id) DO NOTHING
    `);
  }
}

export const backendDatabase = new BackendDatabase();
