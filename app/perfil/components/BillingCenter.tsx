"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, CreditCard, FileText, RefreshCw } from "lucide-react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard, CARVIPIXDataTable } from "@/app/design-system";

type BillingMembershipState = "ACTIVO" | "PENDIENTE" | "SUSPENDIDO" | "CANCELADO" | "EXPIRADO";

type BillingSnapshot = {
  membership: {
    plan: string;
    state: BillingMembershipState;
    stateLabel: string;
    startDate: string | null;
    nextChargeDate: string | null;
    expiryDate: string | null;
    autoRenew: boolean;
    daysRemaining: number | null;
    accessKeepsUntil: string | null;
    benefits: string[];
    subscriptionId: string | null;
  };
  paymentHistory: Array<{
    id: string;
    date: string | null;
    concept: string;
    plan: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    status: string;
    transactionId: string;
    details: Record<string, unknown>;
  }>;
  billingProfile: {
    legalName: string;
    taxId: string;
    fiscalAddress: string;
    fiscalEmail: string;
    updatedAt: string | null;
  };
  paymentMethod: {
    activeMethod: string;
    status: string;
    last4: string | null;
    updatedAt: string | null;
    brand: string | null;
    alias: string | null;
  };
};

type BillingPayload = {
  data?: BillingSnapshot;
  error?: string;
  ok?: boolean;
};

type ActionState = "idle" | "saving";

const emptySnapshot: BillingSnapshot = {
  membership: {
    plan: "SIN PLAN",
    state: "PENDIENTE",
    stateLabel: "Pendiente",
    startDate: null,
    nextChargeDate: null,
    expiryDate: null,
    autoRenew: false,
    daysRemaining: null,
    accessKeepsUntil: null,
    benefits: [],
    subscriptionId: null,
  },
  paymentHistory: [],
  billingProfile: {
    legalName: "",
    taxId: "",
    fiscalAddress: "",
    fiscalEmail: "",
    updatedAt: null,
  },
  paymentMethod: {
    activeMethod: "No definido",
    status: "active",
    last4: null,
    updatedAt: null,
    brand: null,
    alias: null,
  },
};

function formatDate(value: string | null): string {
  if (!value) {
    return "No disponible";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "No disponible";
  }

  return parsed.toLocaleString("es-ES");
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function stateVariant(state: BillingMembershipState): "success" | "warning" | "danger" | "default" {
  if (state === "ACTIVO") return "success";
  if (state === "PENDIENTE") return "warning";
  if (state === "SUSPENDIDO" || state === "CANCELADO" || state === "EXPIRADO") return "danger";
  return "default";
}

function paymentStatusVariant(status: string): "success" | "warning" | "danger" | "default" {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("completado") || normalized.includes("paid")) return "success";
  if (normalized.includes("pendiente")) return "warning";
  if (normalized.includes("cancel") || normalized.includes("fall")) return "danger";
  return "default";
}

export default function BillingCenter() {
  const [snapshot, setSnapshot] = useState<BillingSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const [billingDraft, setBillingDraft] = useState({
    legalName: "",
    taxId: "",
    fiscalAddress: "",
    fiscalEmail: "",
  });

  const selectedPayment = useMemo(
    () => snapshot.paymentHistory.find((item) => item.id === selectedPaymentId) ?? null,
    [selectedPaymentId, snapshot.paymentHistory]
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/client/billing", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as BillingPayload;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "No se pudo cargar el centro de facturacion");
      }

      setSnapshot(payload.data);
      setBillingDraft({
        legalName: payload.data.billingProfile.legalName,
        taxId: payload.data.billingProfile.taxId,
        fiscalAddress: payload.data.billingProfile.fiscalAddress,
        fiscalEmail: payload.data.billingProfile.fiscalEmail,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar facturacion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = Promise.resolve().then(() => load());
    void task;
  }, []);

  const postAction = async (action: "updateBillingProfile" | "toggleAutoRenew" | "setPaymentMethod", payload: Record<string, unknown>) => {
    setActionState("saving");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/client/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });

      const body = (await response.json().catch(() => ({}))) as BillingPayload;
      if (!response.ok || !body.data) {
        throw new Error(body.error || "No se pudo completar la accion de facturacion");
      }

      setSnapshot(body.data);
      setSuccess("Actualizacion aplicada correctamente.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la accion");
    } finally {
      setActionState("idle");
    }
  };

  const paymentColumns = useMemo(
    () => [
      {
        key: "date",
        header: "Fecha",
        render: (row: BillingSnapshot["paymentHistory"][number]) => formatDate(row.date),
      },
      { key: "concept", header: "Concepto" },
      { key: "plan", header: "Plan" },
      { key: "paymentMethod", header: "Metodo" },
      {
        key: "amount",
        header: "Monto",
        render: (row: BillingSnapshot["paymentHistory"][number]) => formatAmount(row.amount, row.currency),
      },
      { key: "currency", header: "Moneda" },
      {
        key: "status",
        header: "Estado",
        render: (row: BillingSnapshot["paymentHistory"][number]) => (
          <CARVIPIXBadge variant={paymentStatusVariant(row.status)}>{row.status}</CARVIPIXBadge>
        ),
      },
      {
        key: "transactionId",
        header: "ID transaccion",
        render: (row: BillingSnapshot["paymentHistory"][number]) => (
          <span className="font-mono text-xs text-[#D4AF37]">{row.transactionId}</span>
        ),
      },
      {
        key: "details",
        header: "Detalle",
        render: (row: BillingSnapshot["paymentHistory"][number]) => (
          <button
            type="button"
            onClick={() => setSelectedPaymentId(row.id)}
            className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            Ver
          </button>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="cv-card-muted rounded-2xl border border-white/10 p-8">
        <p className="text-white/70">Cargando centro de facturacion...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Centro de Facturacion</p>
          <h3 className="mt-2 text-2xl font-bold">Membresia, pagos y metodos de cobro</h3>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>
          Actualizar
        </CARVIPIXButton>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-lg font-bold">Estado de la membresia</h4>
            <CARVIPIXBadge variant={stateVariant(snapshot.membership.state)}>{snapshot.membership.stateLabel}</CARVIPIXBadge>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-white/75 sm:grid-cols-2">
            <p>Plan contratado: <span className="text-white font-semibold">{snapshot.membership.plan}</span></p>
            <p>Renovacion automatica: <span className="text-white font-semibold">{snapshot.membership.autoRenew ? "Si" : "No"}</span></p>
            <p>Fecha de inicio: <span className="text-white">{formatDate(snapshot.membership.startDate)}</span></p>
            <p>Proximo cobro: <span className="text-white">{formatDate(snapshot.membership.nextChargeDate)}</span></p>
            <p>Vencimiento: <span className="text-white">{formatDate(snapshot.membership.expiryDate)}</span></p>
            <p>Dias restantes: <span className="text-white">{snapshot.membership.daysRemaining ?? "No aplica"}</span></p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <CARVIPIXButton
              variant={snapshot.membership.autoRenew ? "danger" : "premium"}
              size="sm"
              disabled={actionState === "saving"}
              onClick={() =>
                void postAction("toggleAutoRenew", {
                  enabled: !snapshot.membership.autoRenew,
                })
              }
            >
              {snapshot.membership.autoRenew ? "Cancelar renovacion" : "Reactivar renovacion"}
            </CARVIPIXButton>
            <span className="text-xs text-white/60 self-center">
              El acceso se mantiene hasta {formatDate(snapshot.membership.accessKeepsUntil)} aunque canceles renovacion.
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-[#D4AF37]">Beneficios del plan</p>
            <ul className="mt-3 space-y-1 text-sm text-white/75">
              {snapshot.membership.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        </CARVIPIXCard>

        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#D4AF37]" />
            <h4 className="text-lg font-bold">Metodo de pago</h4>
          </div>
          <div className="space-y-2 text-sm text-white/75">
            <p>Metodo activo: <span className="text-white">{snapshot.paymentMethod.activeMethod}</span></p>
            <p>Estado: <span className="text-white">{snapshot.paymentMethod.status}</span></p>
            <p>Ultimos 4: <span className="text-white">{snapshot.paymentMethod.last4 ?? "No aplica"}</span></p>
            <p>Actualizado: <span className="text-white">{formatDate(snapshot.paymentMethod.updatedAt)}</span></p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/70">
              El cambio directo de metodo de pago desde CARVIPIX estara disponible proximamente.
              Por ahora debes administrarlo desde PayPal para evitar estados inconsistentes.
            </p>
            <div className="mt-3">
              <Link href="/checkout" className="inline-flex rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">
                Administrar en PayPal
              </Link>
            </div>
          </div>
        </CARVIPIXCard>
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#D4AF37]" />
          <h4 className="text-lg font-bold">Datos fiscales (estructura preparada)</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-white/60">Razon social</span>
            <input
              value={billingDraft.legalName}
              onChange={(event) => setBillingDraft((prev) => ({ ...prev, legalName: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-white/60">RFC</span>
            <input
              value={billingDraft.taxId}
              onChange={(event) => setBillingDraft((prev) => ({ ...prev, taxId: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-white/60">Domicilio fiscal</span>
            <input
              value={billingDraft.fiscalAddress}
              onChange={(event) => setBillingDraft((prev) => ({ ...prev, fiscalAddress: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-white/60">Correo de facturacion</span>
            <input
              type="email"
              value={billingDraft.fiscalEmail}
              onChange={(event) => setBillingDraft((prev) => ({ ...prev, fiscalEmail: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/60">Ultima actualizacion: {formatDate(snapshot.billingProfile.updatedAt)}</p>
          <CARVIPIXButton
            variant="premium"
            size="sm"
            disabled={actionState === "saving"}
            onClick={() => void postAction("updateBillingProfile", billingDraft)}
          >
            Guardar datos fiscales
          </CARVIPIXButton>
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h4 className="text-lg font-bold mb-4">Historial de pagos</h4>
        <CARVIPIXDataTable
          columns={paymentColumns}
          rows={snapshot.paymentHistory}
          rowKey={(row) => row.id}
          emptyLabel="Aun no hay pagos registrados"
        />
      </CARVIPIXCard>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/85 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0B0B0B] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-lg font-bold">Detalle de transaccion</h5>
              <button
                type="button"
                onClick={() => setSelectedPaymentId(null)}
                className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-2 text-sm text-white/75">
              <p>Concepto: <span className="text-white">{selectedPayment.concept}</span></p>
              <p>ID: <span className="font-mono text-[#D4AF37]">{selectedPayment.transactionId}</span></p>
              <p>Fecha: <span className="text-white">{formatDate(selectedPayment.date)}</span></p>
              <p>Monto: <span className="text-white">{formatAmount(selectedPayment.amount, selectedPayment.currency)}</span></p>
              <p>Estado: <span className="text-white">{selectedPayment.status}</span></p>
            </div>
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
{JSON.stringify(selectedPayment.details, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
