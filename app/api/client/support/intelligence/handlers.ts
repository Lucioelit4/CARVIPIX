import { NextRequest, NextResponse } from "next/server";

import {
  detectEscalation,
  getActiveKnowledgeVersion,
  resolveOfficialAnswer,
  searchOfficialFaq,
  type UserSegment,
} from "@/app/lib/support/official-knowledge";
import {
  buildSupportConversationId,
  buildSupportTurnId,
  getSupportConversation,
  upsertSupportConversation,
} from "@/app/backend/core/local-support-store";

type SupportAuthSuccess = {
  ok: true;
  user: {
    id: string;
    email?: string;
    nombre?: string;
    user_role?: string;
  };
};

type SupportAuthFailure = {
  ok: false;
  response: NextResponse;
};

type ResolvedSupportProfile = {
  segment: UserSegment;
  plan: "free" | "basic" | "advanced";
  hasMembership: boolean;
  services: {
    bot: boolean;
    capital: boolean;
  };
};

export type SupportIntelligenceDependencies = {
  requireAuth: (request: NextRequest) => Promise<SupportAuthSuccess | SupportAuthFailure>;
  resolveProfile: (userId: string | null, authUser?: SupportAuthSuccess["user"]) => Promise<ResolvedSupportProfile>;
  createTicket: (input: {
    userId: string;
    subject: string;
    category: string;
    priority: "low" | "medium" | "high";
    message: string;
    conversation: Array<{ role: "user" | "assistant"; content: string }>;
    responsible: string;
  }) => Promise<{ id: string }>;
};

function normalizeMessage(value: unknown): string {
  return String(value ?? "").trim();
}

function pickConversationWindow(turns: Array<{ role: "user" | "assistant"; content: string }>) {
  return turns.slice(-8);
}

export function createSupportIntelligenceHandlers(deps: SupportIntelligenceDependencies) {
  return {
    GET: async function GET(request: NextRequest) {
      const auth = await deps.requireAuth(request);
      const userId = auth.ok ? auth.user.id : null;
      const profile = await deps.resolveProfile(userId, auth.ok ? auth.user : undefined);

      const q = String(request.nextUrl.searchParams.get("q") ?? "").trim();
      const category = (String(request.nextUrl.searchParams.get("category") ?? "all").trim() || "all") as
        | "all"
        | "empresa"
        | "alertas"
        | "bot"
        | "membresias"
        | "pagos"
        | "facturacion"
        | "gestion-capital"
        | "fondeo"
        | "resultados"
        | "comunidad"
        | "soporte"
        | "problemas-tecnicos"
        | "cuenta"
        | "seguridad"
        | "legal"
        | "administracion";
      const popularOnly = String(request.nextUrl.searchParams.get("popular") ?? "false").toLowerCase() === "true";
      const relatedTo = String(request.nextUrl.searchParams.get("relatedTo") ?? "").trim();

      const list = searchOfficialFaq({ query: q, category, popularOnly, limit: 30 });
      const related = relatedTo ? searchOfficialFaq({ query: relatedTo, category: "all", limit: 6 }) : [];
      const knowledgeVersion = getActiveKnowledgeVersion();

      return NextResponse.json(
        {
          data: {
            faq: list,
            related,
            top: searchOfficialFaq({ category: "all", popularOnly: true, limit: 8 }),
            profile,
            knowledgeVersion,
            requiresLoginForPrivateEscalation: true,
          },
        },
        { status: 200 }
      );
    },

    POST: async function POST(request: NextRequest) {
      const auth = await deps.requireAuth(request);
      const userId = auth.ok ? auth.user.id : null;
      const profile = await deps.resolveProfile(userId, auth.ok ? auth.user : undefined);

      const body = (await request.json().catch(() => ({}))) as {
        message?: string;
        action?: "ask" | "ask-and-escalate";
        conversationId?: string;
      };

      const message = normalizeMessage(body.message);
      if (!message) {
        return NextResponse.json({ error: "message es requerido" }, { status: 400 });
      }

      const conversationId = normalizeMessage(body.conversationId) || buildSupportConversationId();
      const conversation = await getSupportConversation(conversationId);
      const turns = conversation?.turns.map((turn) => ({ role: turn.role, content: turn.content })) ?? [];
      const newTurns = [...turns, { role: "user" as const, content: message }];

      const resolution = resolveOfficialAnswer({
        question: message,
        segment: profile.segment,
        plan: profile.plan,
        hasMembership: profile.hasMembership,
        services: profile.services,
        history: pickConversationWindow(newTurns),
        lastIntentId: conversation?.lastIntentId ?? null,
      });

      let mustEscalate = resolution.requiresHumanIntervention || resolution.shouldEscalate || body.action === "ask-and-escalate";
      const escalationSignal = detectEscalation(message);
      if (escalationSignal.shouldEscalate) {
        mustEscalate = true;
      }

      let escalationTicketId: string | null = null;
      if (mustEscalate && !userId) {
        const answerForVisitor = `${resolution.answer}\n\nNo puedo escalar este caso sin sesion activa. Inicia sesion para crear ticket automatico.`;
        const finalTurns = [...newTurns, { role: "assistant" as const, content: answerForVisitor }];

        await upsertSupportConversation({
          conversationId,
          userId,
          lastIntentId: resolution.intentId,
          turns: finalTurns.map((turn) => ({
            id: buildSupportTurnId(turn.role),
            role: turn.role,
            content: turn.content,
            createdAt: new Date().toISOString(),
          })),
        });

        return NextResponse.json(
          {
            error: "Debes iniciar sesion para escalar este caso a soporte humano",
            data: {
              conversationId,
              answer: answerForVisitor,
              confidence: resolution.confidence,
              intentId: resolution.intentId,
              category: resolution.category,
              queryClassification: resolution.queryClassification,
              knowledgeVersion: resolution.knowledgeVersion,
              escalated: false,
              escalationTicketId: null,
              officialSources: resolution.officialSources,
              profile,
            },
          },
          { status: 401 }
        );
      }

      if (mustEscalate && userId) {
        const ticket = await deps.createTicket({
          userId,
          subject: "Escalacion automatica desde Agente Inteligente",
          category: resolution.escalationCategory ?? escalationSignal.category,
          priority: resolution.escalationPriority ?? escalationSignal.priority,
          message: [
            "Consulta original:",
            message,
            "",
            "Clasificacion interna:",
            resolution.queryClassification,
            "",
            "Version de conocimiento activa:",
            resolution.knowledgeVersion,
            "",
            "Motivo de escalacion:",
            resolution.escalationReason ?? escalationSignal.reason ?? "Solicitud del usuario",
          ].join("\n"),
          conversation: pickConversationWindow(newTurns),
          responsible: "support-admin-queue",
        });
        escalationTicketId = ticket.id;
      }

      const finalAnswer = escalationTicketId
        ? `${resolution.answer}\n\nTicket creado automaticamente: ${escalationTicketId}`
        : resolution.answer;

      const finalTurns = [...newTurns, { role: "assistant" as const, content: finalAnswer }];
      await upsertSupportConversation({
        conversationId,
        userId,
        lastIntentId: resolution.intentId,
        turns: finalTurns.map((turn) => ({
          id: buildSupportTurnId(turn.role),
          role: turn.role,
          content: turn.content,
          createdAt: new Date().toISOString(),
        })),
      });

      return NextResponse.json(
        {
          data: {
            conversationId,
            answer: finalAnswer,
            confidence: resolution.confidence,
            intentId: resolution.intentId,
            category: resolution.category,
            queryClassification: resolution.queryClassification,
            knowledgeVersion: resolution.knowledgeVersion,
            escalated: Boolean(escalationTicketId),
            escalationTicketId,
            officialSources: resolution.officialSources,
            profile,
          },
        },
        { status: 200 }
      );
    },
  };
}
