"use client";

import { useState } from "react";

type CancelSubscriptionButtonProps = {
  subscriptionId: string;
};

export default function CancelSubscriptionButton({ subscriptionId }: CancelSubscriptionButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cancel = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/payments/paypal/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelacion solicitada por cliente" }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; data?: { status?: string } };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cancelar la suscripcion");
      }

      setMessage(`Suscripcion marcada como ${payload.data?.status || "CANCELLED"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cancelar la suscripcion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={busy}
        className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Cancelando..." : "Cancelar suscripcion"}
      </button>
      {message ? <p className="text-xs text-white/70">{message}</p> : null}
    </div>
  );
}
