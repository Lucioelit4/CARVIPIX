import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { NextRequest } from "next/server";

import { hashPassword } from "@/app/backend/core/local-auth-store";
import { POST as registerPost } from "@/app/api/auth/register/route";
import {
  checkTokenIssueGuard,
  consumePasswordResetToken,
  consumeVerificationToken,
  createPasswordResetToken,
  createVerificationToken,
  hashToken,
} from "./server";
import { createUser, findUserByEmail, updateUser } from "@/app/backend/core/local-auth-store";

const STORE_PATH = path.join(process.cwd(), "data", "auth-state.json");

async function readStore(): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function resetStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(
    STORE_PATH,
    JSON.stringify(
      {
        users: [],
        memberships: [],
        payments: [],
        billingProfiles: [],
        paymentMethodReferences: [],
        sessions: [],
        verificationTokens: [],
        passwordResetTokens: [],
      },
      null,
      2
    ),
    "utf8"
  );
}

test.beforeEach(async () => {
  await resetStore();
});

test("verification token is single-use", async () => {
  const userId = "test-user-single-use";
  await createUser({
    id: userId,
    email: "single.use@example.com",
    nombre: "Single",
    apellido: "Use",
    passwordHash: hashPassword("Password123"),
    telefono: "+5215551110000",
    pais: "MX",
  });

  const token = await createVerificationToken(userId);
  const firstConsume = await consumeVerificationToken(token);
  const secondConsume = await consumeVerificationToken(token);

  assert.equal(firstConsume, true);
  assert.equal(secondConsume, false);
});

test("verification token expires and cannot be consumed", async () => {
  const userId = "test-user-expired-token";
  await createUser({
    id: userId,
    email: "expired.token@example.com",
    nombre: "Expired",
    apellido: "Token",
    passwordHash: hashPassword("Password123"),
    telefono: "+5215551110001",
    pais: "MX",
  });

  const token = await createVerificationToken(userId);
  const tokenHash = hashToken(token);
  const store = await readStore();
  const tokens = ((store.verificationTokens as Array<Record<string, unknown>>) ?? []).map((entry) => {
    if (String(entry.tokenHash ?? "") === tokenHash) {
      return {
        ...entry,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      };
    }

    return entry;
  });

  await fs.writeFile(STORE_PATH, JSON.stringify({ ...store, verificationTokens: tokens }, null, 2), "utf8");

  const consumed = await consumeVerificationToken(token);
  assert.equal(consumed, false);
});

test("verification resend is limited by issuance guard", async () => {
  const userId = "test-user-rate-limit";
  await createUser({
    id: userId,
    email: "rate.limit@example.com",
    nombre: "Rate",
    apellido: "Limit",
    passwordHash: hashPassword("Password123"),
    telefono: "+5215551110002",
    pais: "MX",
  });

  const initial = await checkTokenIssueGuard({
    userId,
    kind: "verification",
    maxInWindow: 5,
    windowMinutes: 60,
    minIntervalSeconds: 45,
  });
  assert.equal(initial.allowed, true);

  await createVerificationToken(userId);

  const second = await checkTokenIssueGuard({
    userId,
    kind: "verification",
    maxInWindow: 5,
    windowMinutes: 60,
    minIntervalSeconds: 45,
  });
  assert.equal(second.allowed, false);
});

test("register does not duplicate unverified account and returns clear resend message", async () => {
  const payload = {
    nombre: "Carlos",
    apellido: "Pendiente",
    correo: "duplicate.unverified@example.com",
    telefono: "+5215551110003",
    pais: "MX",
    password: "Password123",
    confirmPassword: "Password123",
    aceptaTerminos: true,
  };

  const firstResponse = await registerPost(
    new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  assert.equal(firstResponse.status, 201);

  const secondResponse = await registerPost(
    new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

  assert.equal(secondResponse.status, 200);
  const secondJson = (await secondResponse.json()) as { ok?: boolean; message?: string };
  assert.equal(secondJson.ok, true);
  assert.match(String(secondJson.message ?? ""), /pendiente de verificacion/i);

  const store = await readStore();
  const users = (store.users as Array<Record<string, unknown>>) ?? [];
  const matching = users.filter((item) => String(item.email ?? "") === payload.correo);
  assert.equal(matching.length, 1);
});

test("register rejects duplicate verified account", async () => {
  const payload = {
    nombre: "Veri",
    apellido: "Ficado",
    correo: "duplicate.verified@example.com",
    telefono: "+5215551110004",
    pais: "MX",
    password: "Password123",
    confirmPassword: "Password123",
    aceptaTerminos: true,
  };

  const firstResponse = await registerPost(
    new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  assert.equal(firstResponse.status, 201);

  const created = await findUserByEmail(payload.correo);
  assert.ok(created);
  await updateUser(created.id, { verificado: true, estado: "activo" });

  const secondResponse = await registerPost(
    new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

  assert.equal(secondResponse.status, 409);
});

test("password recovery token supports valid and invalid consumption", async () => {
  const userId = "test-user-password-reset";
  await createUser({
    id: userId,
    email: "password.reset@example.com",
    nombre: "Password",
    apellido: "Reset",
    passwordHash: hashPassword("Password123"),
    telefono: "+5215551110005",
    pais: "MX",
  });

  const token = await createPasswordResetToken(userId);
  const valid = await consumePasswordResetToken(token, hashPassword("NewPassword123"));
  const invalid = await consumePasswordResetToken(token, hashPassword("AnotherPassword123"));

  assert.equal(valid, true);
  assert.equal(invalid, false);
});

test("register degrades safely when smtp is selected but unavailable", async () => {
  const previous = {
    transport: process.env.EMAIL_TRANSPORT,
    host: process.env.EMAIL_SMTP_HOST,
    user: process.env.EMAIL_SMTP_USER,
    password: process.env.EMAIL_SMTP_PASSWORD,
  };

  process.env.EMAIL_TRANSPORT = "smtp";
  delete process.env.EMAIL_SMTP_HOST;
  delete process.env.EMAIL_SMTP_USER;
  delete process.env.EMAIL_SMTP_PASSWORD;

  try {
    const payload = {
      nombre: "Degraded",
      apellido: "Provider",
      correo: "provider.down@example.com",
      telefono: "+5215551110006",
      pais: "MX",
      password: "Password123",
      confirmPassword: "Password123",
      aceptaTerminos: true,
    };

    const response = await registerPost(
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    assert.equal(response.status, 201);
    const json = (await response.json()) as { emailDelivery?: string };
    assert.equal(json.emailDelivery, "failed");
  } finally {
    process.env.EMAIL_TRANSPORT = previous.transport;
    process.env.EMAIL_SMTP_HOST = previous.host;
    process.env.EMAIL_SMTP_USER = previous.user;
    process.env.EMAIL_SMTP_PASSWORD = previous.password;
  }
});

