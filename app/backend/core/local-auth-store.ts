import "server-only";

import fs from "fs/promises";
import path from "path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type LocalPlan = "demo" | "pro" | "premium" | "enterprise";
export type LocalMembershipStatus = "activo" | "cancelado" | "vencido" | "inactivo";

export type LocalUser = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  userType: "STANDARD" | "FOUNDER";
  userRole: "CLIENT";
  excludeFromCommercialMetrics: boolean;
  plan: LocalPlan;
  estado: "activo" | "inactivo" | "suspendido";
  fechaActivacion: string;
  fechaVencimiento?: string | null;
  verificado: boolean;
  passwordHash?: string | null;
  telefono?: string | null;
  pais?: string | null;
  createdAt: string;
};

export type LocalMembership = {
  userId: string;
  plan: LocalPlan;
  estado: LocalMembershipStatus;
  fechaInicio: string;
  fechaFin?: string | null;
  renovacionAutomatica: boolean;
};

export type LocalPayment = {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  fecha: string;
};

export type LocalBillingProfile = {
  id: string;
  userId: string;
  legalName: string;
  taxId?: string;
  taxCountry?: string;
  taxRegime?: string;
  fiscalEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LocalPaymentMethodReference = {
  id: string;
  userId: string;
  provider: "stripe" | "mercadopago" | "openpay" | "custom";
  providerPaymentMethodId?: string;
  tokenReference: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  alias?: string;
  paymentType?: "card_credit" | "card_debit" | "bank_transfer" | "spei" | "cash_voucher" | "wallet" | "other";
  isDefault: boolean;
  status: "active" | "inactive" | "expired" | "revoked";
  billingProfileId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type LocalSession = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastSeenAt?: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceLabel?: string | null;
};

type LocalVerificationToken = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type LocalPasswordResetToken = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type LocalStore = {
  users: LocalUser[];
  memberships: LocalMembership[];
  payments: LocalPayment[];
  billingProfiles: LocalBillingProfile[];
  paymentMethodReferences: LocalPaymentMethodReference[];
  sessions: LocalSession[];
  verificationTokens: LocalVerificationToken[];
  passwordResetTokens: LocalPasswordResetToken[];
};

const STORE_PATH = path.join(process.cwd(), "data", "auth-state.json");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blankStore(): LocalStore {
  return {
    users: [],
    memberships: [],
    payments: [],
    billingProfiles: [],
    paymentMethodReferences: [],
    sessions: [],
    verificationTokens: [],
    passwordResetTokens: [],
  };
}

async function ensureStoreDir() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<LocalStore> {
  await ensureStoreDir();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await fs.readFile(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalStore> | null;
      const hydrated = {
        ...blankStore(),
        ...(parsed ?? {}),
      };

      hydrated.users = (hydrated.users ?? []).map((user) => ({
        ...user,
        userType: user.userType === "FOUNDER" ? "FOUNDER" : "STANDARD",
        userRole: "CLIENT",
        excludeFromCommercialMetrics: Boolean(user.excludeFromCommercialMetrics),
      }));

      return hydrated;
    } catch (error) {
      const maybeFsError = error as NodeJS.ErrnoException;
      if (maybeFsError?.code === "ENOENT") {
        const store = blankStore();
        await writeStore(store);
        return store;
      }

      const transientFsIssue =
        maybeFsError?.code === "EBUSY" ||
        maybeFsError?.code === "EPERM" ||
        maybeFsError?.code === "EACCES";
      const jsonRace = error instanceof SyntaxError;

      if (attempt < 2 && (transientFsIssue || jsonRace)) {
        await sleep(30 * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Auth store unavailable");
}

async function writeStore(store: LocalStore): Promise<void> {
  await ensureStoreDir();
  const payload = JSON.stringify(store, null, 2);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const tempPath = `${STORE_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
    try {
      await fs.writeFile(tempPath, payload, "utf8");
      await fs.rename(tempPath, STORE_PATH);
      return;
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // Best effort cleanup.
      }

      const maybeFsError = error as NodeJS.ErrnoException;
      const transientFsIssue =
        maybeFsError?.code === "EBUSY" ||
        maybeFsError?.code === "EPERM" ||
        maybeFsError?.code === "EACCES";

      if (attempt < 2 && transientFsIssue) {
        await sleep(30 * (attempt + 1));
        continue;
      }

      throw error;
    }
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function nowPlusHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function getFounderDefaults() {
  return {
    id: String(process.env.FOUNDER_USER_ID ?? "founder-client").trim() || "founder-client",
    email: String(process.env.FOUNDER_EMAIL ?? "fundador.uat@carvipix.local").trim().toLowerCase(),
    nombre: String(process.env.FOUNDER_FIRST_NAME ?? "Daniel").trim() || "Daniel",
    apellido: String(process.env.FOUNDER_LAST_NAME ?? "Ortega").trim() || "Ortega",
    telefono: String(process.env.FOUNDER_PHONE ?? "5512345678").trim() || "5512345678",
    pais: String(process.env.FOUNDER_COUNTRY ?? "MX").trim() || "MX",
  };
}

function resolveFounderPasswordHash(store: LocalStore): string | null {
  const envHash = String(process.env.FOUNDER_PASSWORD_HASH ?? "").trim();
  if (envHash) {
    return envHash;
  }

  const envPassword = String(process.env.FOUNDER_PASSWORD ?? "").trim();
  if (envPassword) {
    return hashPassword(envPassword);
  }

  // Local workspace fallback to keep founder QA account available in non-production environments.
  return "scrypt:492f68f50082bd88b27bb3a47b09abe2:f61f96ce7f388635b4a993e3b9a6c0fba56c77983c4a76f4d30af2cd8cfb013e9024ff9f19a64bb3ff2114ce8f19eea083f7742e8230ad48434e9be57fe4d418";
}

function upsertFounderAccount(store: LocalStore): void {
  const defaults = getFounderDefaults();
  const passwordHash = resolveFounderPasswordHash(store);
  if (!passwordHash) {
    return;
  }

  const byEmail = store.users.find((user) => user.email === defaults.email);
  const byId = store.users.find((user) => user.id === defaults.id);
  const existing = byEmail ?? byId;
  const founderId = existing?.id ?? defaults.id;
  const activationDate = existing?.fechaActivacion ?? nowIso();
  const createdAt = existing?.createdAt ?? nowIso();

  const founder: LocalUser = {
    id: founderId,
    email: defaults.email,
    nombre: existing?.nombre || defaults.nombre,
    apellido: existing?.apellido || defaults.apellido,
    userType: "FOUNDER",
    userRole: "CLIENT",
    excludeFromCommercialMetrics: true,
    plan: "pro",
    estado: "activo",
    fechaActivacion: activationDate,
    fechaVencimiento: null,
    verificado: true,
    passwordHash,
    telefono: existing?.telefono || defaults.telefono,
    pais: existing?.pais || defaults.pais,
    createdAt,
  };

  store.users = [
    founder,
    ...store.users.filter((user) => user.id !== founder.id && user.email !== founder.email),
  ];

  store.memberships = [
    {
      userId: founder.id,
      plan: "pro",
      estado: "activo",
      fechaInicio: activationDate,
      fechaFin: null,
      renovacionAutomatica: false,
    },
    ...store.memberships.filter((membership) => membership.userId !== founder.id),
  ];
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [algorithm, salt, storedKey] = hash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");
  if (storedBuffer.length !== key.length) {
    return false;
  }

  return timingSafeEqual(key, storedBuffer);
}

export async function findUserByEmail(email: string): Promise<LocalUser | null> {
  const store = await readStore();
  return store.users.find((user) => user.email === email.toLowerCase().trim()) ?? null;
}

export async function createUser(input: {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  passwordHash: string;
  telefono: string;
  pais: string;
}): Promise<LocalUser> {
  const store = await readStore();
  const user: LocalUser = {
    id: input.id,
    email: input.email,
    nombre: input.nombre,
    apellido: input.apellido,
    userType: "STANDARD",
    userRole: "CLIENT",
    excludeFromCommercialMetrics: false,
    plan: "demo",
    estado: "inactivo",
    fechaActivacion: nowIso(),
    fechaVencimiento: null,
    verificado: false,
    passwordHash: input.passwordHash,
    telefono: input.telefono,
    pais: input.pais,
    createdAt: nowIso(),
  };

  store.users = [user, ...store.users.filter((existing) => existing.id !== user.id)];
  store.memberships = [
    {
      userId: user.id,
      plan: "demo",
      estado: "inactivo",
      fechaInicio: nowIso(),
      fechaFin: null,
      renovacionAutomatica: false,
    },
    ...store.memberships.filter((existing) => existing.userId !== user.id),
  ];
  await writeStore(store);
  return user;
}

export async function updateUser(userId: string, patch: Partial<Pick<LocalUser, "plan" | "estado" | "fechaVencimiento" | "verificado">>) {
  const store = await readStore();
  const index = store.users.findIndex((user) => user.id === userId);
  if (index >= 0) {
    store.users[index] = { ...store.users[index], ...patch };
    await writeStore(store);
  }
}

export async function findMembershipByUserId(userId: string): Promise<LocalMembership | null> {
  const store = await readStore();
  return store.memberships.find((membership) => membership.userId === userId) ?? null;
}

export async function upsertMembership(input: {
  userId: string;
  plan: LocalPlan;
  estado: LocalMembershipStatus;
  fechaInicio: string;
  fechaFin?: string | null;
  renovacionAutomatica: boolean;
}): Promise<LocalMembership> {
  const store = await readStore();
  const membership: LocalMembership = {
    userId: input.userId,
    plan: input.plan,
    estado: input.estado,
    fechaInicio: input.fechaInicio,
    fechaFin: input.fechaFin ?? null,
    renovacionAutomatica: input.renovacionAutomatica,
  };
  store.memberships = [membership, ...store.memberships.filter((existing) => existing.userId !== input.userId)];
  await writeStore(store);
  return membership;
}

export async function createSession(userId: string, sessionHours = 12): Promise<{ token: string; expiresAt: Date }> {
  const store = await readStore();
  const token = createRawToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);
  store.sessions = [
    {
      tokenHash,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: nowIso(),
      lastSeenAt: nowIso(),
    },
    ...store.sessions.filter((session) => session.tokenHash !== tokenHash),
  ];
  await writeStore(store);
  return { token, expiresAt };
}

export async function readSessionUser(token: string): Promise<LocalUser | null> {
  const store = await readStore();
  const tokenHash = hashToken(token);
  const session = store.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    return null;
  }

  const user = store.users.find((item) => item.id === session.userId) ?? null;
  return user;
}

export async function revokeSession(token: string): Promise<void> {
  const store = await readStore();
  const tokenHash = hashToken(token);
  store.sessions = store.sessions.filter((session) => session.tokenHash !== tokenHash);
  await writeStore(store);
}

export async function listSessions(userId: string) {
  const store = await readStore();
  return store.sessions.filter((session) => session.userId === userId);
}

export async function revokeSessionByHash(userId: string, tokenHash: string): Promise<boolean> {
  const store = await readStore();
  const before = store.sessions.length;
  store.sessions = store.sessions.filter((session) => !(session.userId === userId && session.tokenHash === tokenHash));
  if (before === store.sessions.length) {
    return false;
  }

  await writeStore(store);
  return true;
}

export async function createVerificationToken(userId: string): Promise<string> {
  const store = await readStore();
  const token = createRawToken();
  const tokenHash = hashToken(token);
  store.verificationTokens = [
    {
      tokenHash,
      userId,
      expiresAt: nowPlusHours(2),
      usedAt: null,
      createdAt: nowIso(),
    },
    ...store.verificationTokens,
  ];
  await writeStore(store);
  return token;
}

export async function consumeVerificationToken(token: string): Promise<boolean> {
  const store = await readStore();
  const tokenHash = hashToken(token);
  const entry = store.verificationTokens.find((item) => item.tokenHash === tokenHash && !item.usedAt && new Date(item.expiresAt) > new Date());
  if (!entry) {
    return false;
  }

  entry.usedAt = nowIso();
  const user = store.users.find((item) => item.id === entry.userId);
  if (user) {
    user.verificado = true;
  }
  await writeStore(store);
  return true;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const store = await readStore();
  const token = createRawToken();
  const tokenHash = hashToken(token);
  store.passwordResetTokens = [
    {
      tokenHash,
      userId,
      expiresAt: nowPlusHours(2),
      usedAt: null,
      createdAt: nowIso(),
    },
    ...store.passwordResetTokens,
  ];
  await writeStore(store);
  return token;
}

export async function consumePasswordResetToken(token: string, newPasswordHash: string): Promise<boolean> {
  const store = await readStore();
  const tokenHash = hashToken(token);
  const entry = store.passwordResetTokens.find((item) => item.tokenHash === tokenHash && !item.usedAt && new Date(item.expiresAt) > new Date());
  if (!entry) {
    return false;
  }

  entry.usedAt = nowIso();
  const user = store.users.find((item) => item.id === entry.userId);
  if (user) {
    user.passwordHash = newPasswordHash;
  }
  await writeStore(store);
  return true;
}

export async function listUsers() {
  const store = await readStore();
  return store.users;
}

export async function listPayments() {
  const store = await readStore();
  return store.payments;
}

export async function recordPayment(input: LocalPayment) {
  const store = await readStore();
  store.payments = [input, ...store.payments.filter((payment) => payment.id !== input.id)];
  await writeStore(store);
}

export async function listBillingProfiles(userId: string): Promise<LocalBillingProfile[]> {
  const store = await readStore();
  return store.billingProfiles.filter((item) => item.userId === userId);
}

export async function upsertBillingProfile(input: LocalBillingProfile): Promise<LocalBillingProfile> {
  const store = await readStore();
  const updatedAt = nowIso();
  const existing = store.billingProfiles.find((item) => item.id === input.id);

  if (input.isDefault) {
    store.billingProfiles = store.billingProfiles.map((item) =>
      item.userId === input.userId ? { ...item, isDefault: false, updatedAt } : item
    );
  }

  const profile: LocalBillingProfile = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? updatedAt,
    updatedAt,
  };

  store.billingProfiles = [profile, ...store.billingProfiles.filter((item) => item.id !== input.id)];
  await writeStore(store);
  return profile;
}

export async function listPaymentMethodReferences(userId: string): Promise<LocalPaymentMethodReference[]> {
  const store = await readStore();
  return store.paymentMethodReferences.filter((item) => item.userId === userId);
}

export async function upsertPaymentMethodReference(input: LocalPaymentMethodReference): Promise<LocalPaymentMethodReference> {
  const store = await readStore();
  const updatedAt = nowIso();
  const existing = store.paymentMethodReferences.find((item) => item.id === input.id);

  if (input.isDefault) {
    store.paymentMethodReferences = store.paymentMethodReferences.map((item) =>
      item.userId === input.userId ? { ...item, isDefault: false, updatedAt } : item
    );
  }

  const methodReference: LocalPaymentMethodReference = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? updatedAt,
    updatedAt,
  };

  store.paymentMethodReferences = [
    methodReference,
    ...store.paymentMethodReferences.filter((item) => item.id !== input.id),
  ];
  await writeStore(store);
  return methodReference;
}

export async function deletePaymentMethodReference(userId: string, id: string): Promise<boolean> {
  const store = await readStore();
  const before = store.paymentMethodReferences.length;
  store.paymentMethodReferences = store.paymentMethodReferences.filter((item) => !(item.id === id && item.userId === userId));

  if (before === store.paymentMethodReferences.length) {
    return false;
  }

  await writeStore(store);
  return true;
}

export async function seedDemoStore() {
  const store = await readStore();
  if (store.users.length > 0) {
    // Ensure founder policy is applied even when store already exists.
    upsertFounderAccount(store);
    await writeStore(store);
    return;
  }

  const demoUserId = "demo-client";
  const demoUser: LocalUser = {
    id: demoUserId,
    email: "demo@carvipix.local",
    nombre: "Cliente",
    apellido: "Demo",
    userType: "STANDARD",
    userRole: "CLIENT",
    excludeFromCommercialMetrics: false,
    plan: "demo",
    estado: "inactivo",
    fechaActivacion: nowIso(),
    fechaVencimiento: null,
    verificado: true,
    passwordHash: hashPassword("Demo1234!"),
    telefono: "0000000000",
    pais: "MX",
    createdAt: nowIso(),
  };

  store.users = [demoUser];
  store.memberships = [
    {
      userId: demoUserId,
      plan: "demo",
      estado: "inactivo",
      fechaInicio: nowIso(),
      fechaFin: null,
      renovacionAutomatica: false,
    },
  ];

  upsertFounderAccount(store);
  await writeStore(store);
}
