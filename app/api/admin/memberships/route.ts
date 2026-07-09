import { NextRequest, NextResponse } from "next/server";
import { normalizeSubscriptionPlan, type SubscriptionPlan } from "@/app/backend/commercial/access-control";
import { listPlanEntitlements, updatePlanEntitlements } from "@/app/backend/commercial/plan-entitlements-store";
import { backendDatabase } from "@/app/backend/core/database";
import { isValidAdminSession } from "@/app/lib/auth/admin-server";
import {
  findMembershipByUserId as findLocalMembershipByUserId,
  listPayments,
  listUsers,
  seedDemoStore,
  updateUser as updateLocalUser,
  upsertMembership as upsertLocalMembership,
} from "@/app/backend/core/local-auth-store";

type AdminPlan = "demo" | "pro" | "premium" | "enterprise";
type AdminMembershipState = "activo" | "cancelado" | "vencido" | "inactivo";

type AdminMembershipRow = {
  user_id: string;
  email: string;
  nombre: string;
  apellido: string;
  user_plan: string;
  user_state: string;
  verificado: boolean;
  membership_plan: string | null;
  membership_state: AdminMembershipState | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  renovacion_automatica: boolean | null;
  created_at: Date | null;
};

type AdminPaymentRow = {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  fecha: Date;
};

type AdminEntitlementsPatch = {
  alertsEnabled?: boolean;
  botEnabled?: boolean;
  maxAlertsPerDay?: number;
  maxPairs?: number;
  maxBots?: number;
  allowedPairs?: string[] | null;
};

function isAdminRequest(request: NextRequest): boolean {
  return isValidAdminSession(request);
}

function resolveMembershipState(state: string | null | undefined, expiryDate: Date | null | undefined): AdminMembershipState {
  if (state === "cancelado" || state === "vencido" || state === "inactivo") {
    return state;
  }

  if (state === "activo" && expiryDate && expiryDate <= new Date()) {
    return "vencido";
  }

  return state === "activo" ? "activo" : "inactivo";
}

function normalizePlan(value: unknown): AdminPlan {
  if (value === "pro" || value === "premium" || value === "enterprise") {
    return value;
  }

  return "demo";
}

async function loadAdminSnapshot() {
  if (!backendDatabase.enabled) {
    await seedDemoStore();
    const users = await listUsers();
    const memberships = new Map(
      (
        await Promise.all(users.map(async (user) => [user.id, await findLocalMembershipByUserId(user.id)] as const))
      ).filter((entry) => Boolean(entry[1])) as Array<readonly [string, NonNullable<Awaited<ReturnType<typeof findLocalMembershipByUserId>>>]>
    );

    return {
      users: users.map((user) => {
        const membership = memberships.get(user.id) ?? null;
        return {
          userId: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          userPlan: user.plan,
          userState: user.estado,
          verificado: user.verificado,
          membershipPlan: membership?.plan ?? user.plan,
          membershipState: membership?.estado ?? 'inactivo',
          fechaInicio: membership?.fechaInicio ?? null,
          fechaFin: membership?.fechaFin ?? null,
          renovacionAutomatica: membership?.renovacionAutomatica ?? false,
          createdAt: user.createdAt,
          hasActiveMembership: membership?.estado === 'activo',
        };
      }),
      payments: (await listPayments()).map((payment) => ({
        id: payment.id,
        userId: payment.userId,
        productId: payment.productId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        fecha: payment.fecha,
      })),
      entitlements: await listPlanEntitlements(),
    };
  }

  const [usersResult, paymentsResult] = await Promise.all([
    backendDatabase.query<AdminMembershipRow>(
      `
      SELECT
        u.id AS user_id,
        u.email,
        u.nombre,
        u.apellido,
        u.plan AS user_plan,
        u.estado AS user_state,
        u.verificado,
        u.created_at,
        m.plan AS membership_plan,
        m.estado AS membership_state,
        m.fecha_inicio,
        m.fecha_fin,
        m.renovacion_automatica
      FROM users u
      LEFT JOIN memberships m ON m.user_id = u.id
      ORDER BY u.created_at DESC, u.id DESC
      `
    ),
    backendDatabase.query<AdminPaymentRow>(
      `
      SELECT id, user_id, product_id, amount, currency, status, method, fecha
      FROM payments
      ORDER BY fecha DESC
      LIMIT 100
      `
    ),
  ]);

  return {
    users: usersResult.rows.map((row) => {
      const membershipState = resolveMembershipState(row.membership_state, row.fecha_fin);
      const active = membershipState === "activo";
      const plan = normalizePlan(row.membership_plan ?? row.user_plan);

      return {
        userId: row.user_id,
        email: row.email,
        nombre: row.nombre,
        apellido: row.apellido,
        userPlan: normalizePlan(row.user_plan),
        userState: row.user_state,
        verificado: row.verificado,
        membershipPlan: plan,
        membershipState,
        fechaInicio: row.fecha_inicio ? row.fecha_inicio.toISOString() : null,
        fechaFin: row.fecha_fin ? row.fecha_fin.toISOString() : null,
        renovacionAutomatica: Boolean(row.renovacion_automatica),
        createdAt: row.created_at ? row.created_at.toISOString() : null,
        hasActiveMembership: active,
      };
    }),
    payments: paymentsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      method: row.method,
      fecha: row.fecha.toISOString(),
    })),
    entitlements: await listPlanEntitlements(),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await loadAdminSnapshot();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar el panel" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      action?: "activate" | "renew" | "cancel" | "change-plan" | "deactivate" | "update-entitlements";
      plan?: AdminPlan;
      durationDays?: number;
      subscriptionPlan?: SubscriptionPlan | string;
      entitlements?: AdminEntitlementsPatch;
    };

    const userId = String(body.userId ?? "").trim();
    const action = body.action;
    const plan = normalizePlan(body.plan);
    const durationDays = Number.isFinite(body.durationDays) && Number(body.durationDays) > 0 ? Math.min(Number(body.durationDays), 3650) : 30;

    if (!action) {
      return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }

    if (action === "update-entitlements") {
      const patch = body.entitlements ?? {};
      await updatePlanEntitlements(normalizeSubscriptionPlan(body.subscriptionPlan), {
        alertsEnabled: typeof patch.alertsEnabled === "boolean" ? patch.alertsEnabled : undefined,
        botEnabled: typeof patch.botEnabled === "boolean" ? patch.botEnabled : undefined,
        maxAlertsPerDay: Number.isFinite(patch.maxAlertsPerDay) ? Number(patch.maxAlertsPerDay) : undefined,
        maxPairs: Number.isFinite(patch.maxPairs) ? Number(patch.maxPairs) : undefined,
        maxBots: Number.isFinite(patch.maxBots) ? Number(patch.maxBots) : undefined,
        allowedPairs: Array.isArray(patch.allowedPairs)
          ? patch.allowedPairs.map((item) => String(item ?? "").trim().toUpperCase()).filter(Boolean)
          : patch.allowedPairs === null
            ? null
            : undefined,
      });

      const data = await loadAdminSnapshot();
      return NextResponse.json({ ok: true, data }, { status: 200 });
    }

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }

    if (!backendDatabase.enabled) {
      const users = await listUsers();
      const user = users.find((item) => item.id === userId);
      if (!user) {
        return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
      }

      const effectivePlan = action === "change-plan" ? plan : plan !== "demo" ? plan : "pro";
      const membershipState = action === "cancel" || action === "deactivate" ? "cancelado" : "activo";
      const fechaInicio = new Date().toISOString();
      const fechaFin = action === "cancel" || action === "deactivate" ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      await upsertLocalMembership({
        userId,
        plan: effectivePlan,
        estado: membershipState,
        fechaInicio,
        fechaFin,
        renovacionAutomatica: action !== "cancel" && action !== "deactivate",
      });

      await updateLocalUser(userId, {
        plan: effectivePlan,
        estado: membershipState === "activo" ? "activo" : "inactivo",
        fechaVencimiento: fechaFin,
      });

      const data = await loadAdminSnapshot();
      return NextResponse.json({ ok: true, data }, { status: 200 });
    }

    await backendDatabase.withTransaction(async (client) => {
      const membershipExists = await client.query<{ user_id: string }>(
        `SELECT user_id FROM memberships WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      const membershipState: AdminMembershipState =
        action === "cancel" || action === "deactivate" ? "cancelado" : action === "activate" || action === "renew" || action === "change-plan" ? "activo" : "inactivo";

      const effectivePlan = action === "change-plan" ? plan : plan !== "demo" ? plan : "pro";
      const fechaInicio = new Date();
      const fechaFin = action === "cancel" || action === "deactivate" ? null : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      if (membershipExists.rows.length === 0) {
        await client.query(
          `
          INSERT INTO memberships (user_id, plan, estado, fecha_inicio, fecha_fin, renovacion_automatica)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [userId, effectivePlan, membershipState, fechaInicio, fechaFin, action !== "cancel" && action !== "deactivate"]
        );
      } else {
        const currentPlan = action === "change-plan" ? effectivePlan : plan;
        await client.query(
          `
          UPDATE memberships
          SET plan = $2,
              estado = $3,
              fecha_inicio = $4,
              fecha_fin = $5,
              renovacion_automatica = $6
          WHERE user_id = $1
          `,
          [userId, currentPlan, membershipState, fechaInicio, fechaFin, action !== "cancel" && action !== "deactivate"]
        );
      }

      await client.query(
        `
        UPDATE users
        SET plan = $2,
            estado = $3,
            fecha_vencimiento = $4
        WHERE id = $1
        `,
        [userId, effectivePlan, membershipState === "activo" ? "activo" : "inactivo", fechaFin]
      );
    });

    const data = await loadAdminSnapshot();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la membresía" }, { status: 500 });
  }
}