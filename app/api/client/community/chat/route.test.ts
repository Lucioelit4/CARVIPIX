import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";

import { createCommunityChatHandlers } from "./handlers";

type DbCall = { sql: string; params: unknown[] };

type MockDb = {
  enabled: boolean;
  calls: DbCall[];
  query: <T extends Record<string, unknown>>(
    sql: string,
    params?: Array<string | number | boolean | Date | null | string[]>
  ) => Promise<{ rows: T[] }>;
};

function createRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function createMockAuth(userId = "community-user") {
  return async () => ({
    ok: true as const,
    user: {
      id: userId,
      nombre: "Miembro Test",
      email: "community@example.com",
    },
  });
}

function createUnauthorizedAuth() {
  return async () => ({
    ok: false as const,
    response: jsonResponse(401, { error: "Unauthorized" }),
  });
}

function createMockDb(): MockDb {
  const calls: DbCall[] = [];

  return {
    enabled: true,
    calls,
    query: async <T extends Record<string, unknown>>(
      sql: string,
      params: Array<string | number | boolean | Date | null | string[]> = []
    ) => {
      calls.push({ sql, params });

      if (sql.includes("FROM community_messages")) {
        return { rows: [] as T[] };
      }

      if (sql.includes("FROM community_moderation_logs")) {
        return { rows: [] as T[] };
      }

      return { rows: [] as T[] };
    },
  };
}

test("GET chat returns channel payload", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      plan: "advanced",
      membershipActive: true,
      hasBot: true,
      hasCapital: true,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/community/chat?channel=chat-principal"));
  assert.equal(response.status, 200);

  const payload = (await response.json()) as { data?: { channel?: string; messages?: unknown[] } };
  assert.equal(payload.data?.channel, "chat-principal");
  assert.ok(Array.isArray(payload.data?.messages));
});

test("POST rejects bad words", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      plan: "advanced",
      membershipActive: true,
      hasBot: true,
      hasCapital: true,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelId: "chat-principal", message: "esto es una mierda" }),
    })
  );

  assert.equal(response.status, 400);
});

test("POST rejects malicious links", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      plan: "advanced",
      membershipActive: true,
      hasBot: true,
      hasCapital: true,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelId: "chat-principal", message: "mira esto http://grabify.link/abc" }),
    })
  );

  assert.equal(response.status, 400);
});

test("POST blocks channel by membership permissions", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      plan: "free",
      membershipActive: false,
      hasBot: false,
      hasCapital: false,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelId: "gestion-de-senales", message: "mensaje permitido?" }),
    })
  );

  assert.equal(response.status, 403);
});

test("POST sends valid message", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth("sender-1"),
    resolveProfile: async () => ({
      plan: "advanced",
      membershipActive: true,
      hasBot: true,
      hasCapital: true,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelId: "chat-principal", message: "Hola equipo, ya revise mi riesgo del dia." }),
    })
  );

  assert.equal(response.status, 201);

  const payload = (await response.json()) as { data?: { id?: string; userId?: string; channelId?: string } };
  assert.ok(payload.data?.id);
  assert.equal(payload.data?.userId, "sender-1");
  assert.equal(payload.data?.channelId, "chat-principal");

  const insertCall = db.calls.find((call) => call.sql.includes("INSERT INTO community_messages"));
  assert.ok(insertCall);
  assert.equal(insertCall?.params[2], "sender-1");
});

test("POST reports a message and records moderation action", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createMockAuth("reporter-1"),
    resolveProfile: async () => ({
      plan: "basic",
      membershipActive: true,
      hasBot: false,
      hasCapital: false,
      isAdmin: false,
    }),
    db,
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "report",
        channelId: "chat-principal",
        messageId: "msg-777",
        reason: "Spam reiterado",
      }),
    })
  );

  assert.equal(response.status, 201);

  const reportInsert = db.calls.find((call) => call.sql.includes("INSERT INTO community_message_reports"));
  const moderationInsert = db.calls.find((call) => call.sql.includes("INSERT INTO community_moderation_logs"));
  assert.ok(reportInsert);
  assert.ok(moderationInsert);
});

test("chat endpoints reject unauthenticated requests", async () => {
  const db = createMockDb();
  const handlers = createCommunityChatHandlers({
    requireAuth: createUnauthorizedAuth(),
    resolveProfile: async () => ({
      plan: "advanced",
      membershipActive: true,
      hasBot: true,
      hasCapital: true,
      isAdmin: false,
    }),
    db,
  });

  const getResponse = await handlers.GET(createRequest("http://localhost:3000/api/client/community/chat"));
  const postResponse = await handlers.POST(
    createRequest("http://localhost:3000/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hola" }),
    })
  );

  assert.equal(getResponse.status, 401);
  assert.equal(postResponse.status, 401);
});
