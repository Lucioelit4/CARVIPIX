-- CARVIPIX migration: identity verification module
-- Date: 2026-07-12

BEGIN;

CREATE TABLE IF NOT EXISTS identity_verification_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'pending', 'approved', 'rejected', 'canceled')),
  declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  declaration_authorized_use BOOLEAN NOT NULL DEFAULT FALSE,
  observations TEXT NOT NULL DEFAULT '',
  rejection_reason TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  documents_deleted_at TIMESTAMPTZ,
  documents_purged_at TIMESTAMPTZ,
  document_lifecycle TEXT NOT NULL DEFAULT 'active' CHECK (document_lifecycle IN ('active', 'logical_deleted', 'purged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_verification_requests_user_updated
  ON identity_verification_requests(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_identity_verification_requests_status_updated
  ON identity_verification_requests(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS identity_verification_files (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES identity_verification_requests(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('front', 'back')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_verification_files_request_side
  ON identity_verification_files(request_id, side);

CREATE TABLE IF NOT EXISTS identity_verification_service_requirements (
  service_key TEXT PRIMARY KEY,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO identity_verification_service_requirements (service_key, required)
VALUES
  ('alerts', false),
  ('bot', false),
  ('capital-management', true),
  ('funding-program', true)
ON CONFLICT (service_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS identity_verification_access_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES identity_verification_requests(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_verification_access_request_created
  ON identity_verification_access_logs(request_id, created_at DESC);

CREATE TABLE IF NOT EXISTS identity_verification_retention_policy (
  id TEXT PRIMARY KEY DEFAULT 'default',
  pending_days INT NOT NULL DEFAULT 30,
  approved_days INT NOT NULL DEFAULT 365,
  rejected_days INT NOT NULL DEFAULT 90,
  canceled_days INT NOT NULL DEFAULT 30,
  purge_after_logical_delete_days INT NOT NULL DEFAULT 30,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO identity_verification_retention_policy (
  id, pending_days, approved_days, rejected_days, canceled_days, purge_after_logical_delete_days
) VALUES (
  'default', 30, 365, 90, 30, 30
) ON CONFLICT (id) DO NOTHING;

COMMIT;
