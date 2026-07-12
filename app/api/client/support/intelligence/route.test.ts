import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";

import { createSupportIntelligenceHandlers } from "./handlers";

function createRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function createMockAuth(userId = "support-user") {
  return async () => ({
    ok: true as const,
    user: {
      id: userId,
      email: "support@example.com",
    },
  });
}

function createUnauthorizedAuth() {
  return async () => ({
    ok: false as const,
    response: jsonResponse(401, { error: "Unauthorized" }),
  });
}

test("GET returns official FAQ for authenticated user", async () => {
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      segment: "miembro-pro",
      plan: "advanced",
      hasMembership: true,
      services: { bot: true, capital: false },
    }),
    createTicket: async () => ({ id: "ticket-ignored" }),
  });

  const response = await handlers.GET(createRequest("http://localhost:3000/api/client/support/intelligence"));
  assert.equal(response.status, 200);

  const payload = (await response.json()) as { data?: { faq?: Array<{ id: string }> } };
  assert.ok(Array.isArray(payload.data?.faq));
  assert.ok((payload.data?.faq?.length ?? 0) > 0);
});

test("POST rejects empty message", async () => {
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      segment: "miembro-pro",
      plan: "advanced",
      hasMembership: true,
      services: { bot: true, capital: false },
    }),
    createTicket: async () => ({ id: "ticket-ignored" }),
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    })
  );

  assert.equal(response.status, 400);
});

test("POST answers known official topic without escalation", async () => {
  let ticketCalls = 0;
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      segment: "miembro-pro",
      plan: "advanced",
      hasMembership: true,
      services: { bot: true, capital: false },
    }),
    createTicket: async () => {
      ticketCalls += 1;
      return { id: "ticket-should-not-create" };
    },
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Que incluye el plan PRO y las alertas?" }),
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    data?: {
      answer?: string;
      escalated?: boolean;
      confidence?: string;
    };
  };

  assert.equal(payload.data?.escalated, false);
  assert.ok((payload.data?.answer ?? "").length > 10);
  assert.equal(ticketCalls, 0);
});

test("POST escalates unknown topic and creates support ticket", async () => {
  let createdTicketId = "";
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createMockAuth("user-escalated"),
    resolveProfile: async () => ({
      segment: "miembro-pro",
      plan: "advanced",
      hasMembership: true,
      services: { bot: true, capital: false },
    }),
    createTicket: async () => {
      createdTicketId = "ticket-ai-escalation";
      return { id: createdTicketId };
    },
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Necesito detalle de politica fiscal de un pais no documentado",
        action: "ask-and-escalate",
      }),
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data?: { escalated?: boolean; escalationTicketId?: string | null } };
  assert.equal(payload.data?.escalated, true);
  assert.equal(payload.data?.escalationTicketId, createdTicketId);
});

test("POST can force escalation even for known topic", async () => {
  let ticketCalls = 0;
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createMockAuth(),
    resolveProfile: async () => ({
      segment: "miembro-pro",
      plan: "advanced",
      hasMembership: true,
      services: { bot: true, capital: false },
    }),
    createTicket: async () => {
      ticketCalls += 1;
      return { id: "ticket-forced" };
    },
  });

  const response = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Como cancelo mi renovacion automatica?",
        action: "ask-and-escalate",
      }),
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { data?: { escalated?: boolean } };
  assert.equal(payload.data?.escalated, true);
  assert.equal(ticketCalls, 1);
});

test("GET intelligence allows public faq without authentication", async () => {
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createUnauthorizedAuth(),
    resolveProfile: async () => ({
      segment: "visitante",
      plan: "free",
      hasMembership: false,
      services: { bot: false, capital: false },
    }),
    createTicket: async () => ({ id: "ticket-ignored" }),
  });

  const getResponse = await handlers.GET(createRequest("http://localhost:3000/api/client/support/intelligence"));
  assert.equal(getResponse.status, 200);
});

test("POST intelligence allows public answer without escalation", async () => {
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createUnauthorizedAuth(),
    resolveProfile: async () => ({
      segment: "visitante",
      plan: "free",
      hasMembership: false,
      services: { bot: false, capital: false },
    }),
    createTicket: async () => ({ id: "ticket-ignored" }),
  });

  const postResponse = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Que planes tienen?" }),
    })
  );

  assert.equal(postResponse.status, 200);
});

test("POST intelligence requires session for forced escalation", async () => {
  const handlers = createSupportIntelligenceHandlers({
    requireAuth: createUnauthorizedAuth(),
    resolveProfile: async () => ({
      segment: "visitante",
      plan: "free",
      hasMembership: false,
      services: { bot: false, capital: false },
    }),
    createTicket: async () => ({ id: "ticket-ignored" }),
  });

  const postResponse = await handlers.POST(
    createRequest("http://localhost:3000/api/client/support/intelligence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Quiero escalar", action: "ask-and-escalate" }),
    })
  );

  assert.equal(postResponse.status, 401);
});
