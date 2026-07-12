-- CARVIPIX migration: billing_profiles and payment_method_references support
-- Date: 2026-07-12
-- Scope: Etapa 1 - Centro de Facturacion (estructura fiscal y metodos referenciados)

BEGIN;

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

CREATE INDEX IF NOT EXISTS idx_billing_profiles_user_updated
  ON billing_profiles(user_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_profiles_user_default
  ON billing_profiles(user_id)
  WHERE is_default = true;

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

CREATE INDEX IF NOT EXISTS idx_payment_method_references_user_updated
  ON payment_method_references(user_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_method_references_user_default
  ON payment_method_references(user_id)
  WHERE is_default = true;

COMMIT;
