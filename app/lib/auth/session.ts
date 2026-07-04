export type AuthRole = "admin" | "cliente" | "invitado";

export type AccessLogType = "admin_login" | "admin_access_denied" | "admin_session_expired";

type AuthSession = {
  role: AuthRole;
  createdAt: number;
  expiresAt: number;
};

type AccessLogEntry = {
  type: AccessLogType;
  createdAt: number;
  pathname?: string;
  detail?: string;
};

type AuthSessionSnapshot = {
  status: "valid" | "expired" | "none";
  session: AuthSession | null;
};

const AUTH_SESSION_KEY = "carvipix_auth_session";
const ACCESS_LOGS_KEY = "carvipix_access_logs";
const AUTH_COOKIE_NAME = "carvipix_auth_role";
const ADMIN_SESSION_MS = 24 * 60 * 60 * 1000;
const CLIENT_SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_LOG_ENTRIES = 200;

function isBrowser() {
  return typeof window !== "undefined";
}

function getSessionDuration(role: AuthRole) {
  return role === "admin" ? ADMIN_SESSION_MS : CLIENT_SESSION_MS;
}

function writeCookie(role: AuthRole, expiresAt: number) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${role}; expires=${new Date(expiresAt).toUTCString()}; path=/; SameSite=Lax`;
}

function clearCookie() {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; expires=${new Date(0).toUTCString()}; path=/; SameSite=Lax`;
}

export function writeAuthSession(role: Exclude<AuthRole, "invitado">) {
  if (!isBrowser()) {
    return null;
  }

  const createdAt = Date.now();
  const expiresAt = createdAt + getSessionDuration(role);
  const session: AuthSession = { role, createdAt, expiresAt };

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  writeCookie(role, expiresAt);

  return session;
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_KEY);
  clearCookie();
}

export function getAuthSessionSnapshot(): AuthSessionSnapshot {
  if (!isBrowser()) {
    return { status: "none", session: null };
  }

  const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return { status: "none", session: null };
  }

  try {
    const session = JSON.parse(rawSession) as AuthSession;
    if (!session?.role || !session?.expiresAt) {
      clearAuthSession();
      return { status: "none", session: null };
    }

    if (Date.now() >= session.expiresAt) {
      clearAuthSession();
      return { status: "expired", session };
    }

    writeCookie(session.role, session.expiresAt);
    return { status: "valid", session };
  } catch {
    clearAuthSession();
    return { status: "none", session: null };
  }
}

export function readAuthSession(): AuthSession | null {
  return getAuthSessionSnapshot().session;
}

export function getCurrentRole(): AuthRole {
  return readAuthSession()?.role ?? "invitado";
}

export function logAccessEvent(type: AccessLogType, detail?: string, pathname?: string) {
  if (!isBrowser()) {
    return;
  }

  const entry: AccessLogEntry = {
    type,
    createdAt: Date.now(),
    pathname: pathname ?? window.location.pathname,
    detail,
  };

  const existingLogs = readAccessLogs();
  const nextLogs = [entry, ...existingLogs].slice(0, MAX_LOG_ENTRIES);

  localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify(nextLogs));

  if (type === "admin_login") {
    console.info("[CARVIPIX][AUTH]", entry);
    return;
  }

  console.warn("[CARVIPIX][AUTH]", entry);
}

export function readAccessLogs(): AccessLogEntry[] {
  if (!isBrowser()) {
    return [];
  }

  const rawLogs = localStorage.getItem(ACCESS_LOGS_KEY);
  if (!rawLogs) {
    return [];
  }

  try {
    const parsedLogs = JSON.parse(rawLogs) as AccessLogEntry[];
    return Array.isArray(parsedLogs) ? parsedLogs : [];
  } catch {
    localStorage.removeItem(ACCESS_LOGS_KEY);
    return [];
  }
}