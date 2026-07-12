# Billing Profiles Schema (Etapa 1)

## Migration
- File: `infra/migrations/20260712_billing_profiles.sql`
- Status: Added for formal schema control in Etapa 1.

## Table: billing_profiles
- `id` TEXT PRIMARY KEY
- `user_id` TEXT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
- `legal_name` TEXT NOT NULL
- `tax_id` TEXT NULL
- `tax_country` CHAR(2) NULL
- `tax_regime` TEXT NULL
- `fiscal_email` TEXT NULL
- `address_line1` TEXT NULL
- `address_line2` TEXT NULL
- `city` TEXT NULL
- `state` TEXT NULL
- `postal_code` TEXT NULL
- `country_code` CHAR(2) NULL
- `is_default` BOOLEAN NOT NULL DEFAULT false
- `metadata` JSONB NOT NULL DEFAULT `{}`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

## Table: payment_method_references
- `id` TEXT PRIMARY KEY
- `user_id` TEXT NOT NULL REFERENCES `users(id)` ON DELETE CASCADE
- `provider` TEXT NOT NULL CHECK IN (`stripe`, `mercadopago`, `openpay`, `custom`)
- `provider_payment_method_id` TEXT NULL
- `token_reference` TEXT NOT NULL
- `brand` TEXT NULL
- `last4` CHAR(4) NULL
- `exp_month` SMALLINT NULL
- `exp_year` SMALLINT NULL
- `alias` TEXT NULL
- `payment_type` TEXT NULL with CHECK enum
- `is_default` BOOLEAN NOT NULL DEFAULT false
- `status` TEXT NOT NULL with CHECK enum
- `billing_profile_id` TEXT NULL REFERENCES `billing_profiles(id)` ON DELETE SET NULL
- `metadata` JSONB NOT NULL DEFAULT `{}`
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

## Indexes and Constraints
- `idx_billing_profiles_user_updated` on (`user_id`, `updated_at` DESC)
- `ux_billing_profiles_user_default` unique partial index on (`user_id`) where `is_default = true`
- `idx_payment_method_references_user_updated` on (`user_id`, `updated_at` DESC)
- `ux_payment_method_references_user_default` unique partial index on (`user_id`) where `is_default = true`

## Data Isolation Guarantee Used by Endpoint
- Billing endpoint reads and writes strictly using authenticated `user_id` from server session.
- Endpoint never accepts effective target `user_id` from frontend payload.
