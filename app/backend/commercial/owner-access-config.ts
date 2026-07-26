const DEFAULT_INTERNAL_OWNER_EMAILS = ["salcidoabraham525@gmail.com", "ymiler94@gmail.com"];

function normalizeEmail(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

export function getInternalOwnerEmails(source = process.env.INTERNAL_OWNER_EMAILS): Set<string> {
  const seed = String(source ?? DEFAULT_INTERNAL_OWNER_EMAILS.join(","));
  const emails = seed
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  if (emails.length === 0) {
    emails.push(...DEFAULT_INTERNAL_OWNER_EMAILS);
  }

  return new Set(emails);
}

export function isInternalOwnerEmail(email: string | null | undefined, source = process.env.INTERNAL_OWNER_EMAILS): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return getInternalOwnerEmails(source).has(normalized);
}