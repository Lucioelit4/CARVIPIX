"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BillingSnapshot = {
  membership: {
    plan: string;
    stateLabel: string;
    nextChargeDate: string | null;
    accessKeepsUntil: string | null;
    autoRenew: boolean;
  };
  paymentHistory: Array<{
    id: string;
    date: string | null;
    concept: string;
    amount: number;
    currency: string;
    status: string;
  }>;
};

type BillingResponse = {
  data?: BillingSnapshot;
  error?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-ES");
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-ES");
}

export default function TraderMembresiaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);

  const loadBilling = async () => {
    const response = await fetch("/api/client/billing", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as BillingResponse;

    if (!response.ok || !payload.data) {
      throw new Error(payload.error || "No fue posible cargar la membresia.");
    }

    setSnapshot(payload.data);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadBilling();
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la membresia.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const paymentPreview = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.paymentHistory.slice(0, 8);
  }, [snapshot]);

  const cancelAutoRenew = async () => {
    setSaving(true);
    setError(null);
    setMessage("");

    try {
      const response = await fetch("/api/client/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleAutoRenew", payload: { enabled: false } }),
      });

      const body = (await response.json().catch(() => ({}))) as BillingResponse;
      if (!response.ok || !body.data) {
        throw new Error(body.error || "No fue posible cancelar la renovacion.");
      }

      setSnapshot(body.data);
      setMessage("Renovacion automatica cancelada. Tu acceso sigue activo hasta la vigencia actual.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No fue posible cancelar la renovacion.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-white/70">Cargando membresia...</p>;
  }

  if (error && !snapshot) {
    return (
      <section className="space-y-3">
        <h1 className="text-xl font-bold">Membresia</h1>
        <p className="text-sm text-rose-200">{error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Membresia</h1>
        <p className="text-sm text-white/70">Panel simple de plan y renovacion.</p>
      </div>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {message ? <p className="text-sm text-[#D4AF37]">{message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Plan contratado" value={snapshot?.membership.plan ?? "SIN MEMBRESIA"} />
        <Card label="Estado" value={snapshot?.membership.stateLabel ?? "-"} />
        <Card label="Vigencia" value={formatDate(snapshot?.membership.accessKeepsUntil ?? null)} />
        <Card label="Renovacion automatica" value={snapshot?.membership.autoRenew ? "Activa" : "Cancelada"} />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0D1624] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/perfil"
            className="rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black"
          >
            Cambiar plan
          </Link>

          {snapshot?.membership.autoRenew ? (
            <button
              type="button"
              disabled={saving}
              onClick={cancelAutoRenew}
              className="rounded-lg border border-rose-300/45 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-60"
            >
              {saving ? "Procesando..." : "Cancelar renovacion"}
            </button>
          ) : (
            <span className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/75">
              Renovacion ya cancelada
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-white/60">Proximo cobro estimado: {formatDate(snapshot?.membership.nextChargeDate ?? null)}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0D1624] p-4">
        <p className="text-sm font-semibold text-white">Historial de pagos</p>
        {paymentPreview.length === 0 ? (
          <p className="mt-2 text-sm text-white/70">Sin pagos registrados.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {paymentPreview.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{item.concept}</p>
                  <span className="text-[#D4AF37]">{item.status}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-white/70">
                  <span>{formatDateTime(item.date)}</span>
                  <span>{item.amount.toFixed(2)} {item.currency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#0D1624] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </article>
  );
}
