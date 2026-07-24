import { backendDatabase } from "../core/database";
import { listUsers } from "../core/local-auth-store";

const DEFAULT_INTERNAL_OWNER_EMAIL = "salcidoabraham525@gmail.com";

function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function getInternalOwnerEmails(): Set<string> {
  const source = String(process.env.INTERNAL_OWNER_EMAILS ?? DEFAULT_INTERNAL_OWNER_EMAIL);
  const emails = source
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  if (emails.length === 0) {
    emails.push(DEFAULT_INTERNAL_OWNER_EMAIL);
  }

  return new Set(emails);
}

export function isInternalOwnerEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return getInternalOwnerEmails().has(normalized);
}

export async function hasInternalOwnerAccess(userId: string): Promise<boolean> {
  if (!userId || userId === "admin-session") {
    return false;
  }

  if (!backendDatabase.enabled) {
    const users = await listUsers();
    const user = users.find((item) => item.id === userId);
    return isInternalOwnerEmail(user?.email);
  }

  const { rows } = await backendDatabase.query<{ email: string }>(
    `
    SELECT email
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return isInternalOwnerEmail(rows[0]?.email);
}