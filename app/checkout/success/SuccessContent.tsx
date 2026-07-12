"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SubscriptionStatusPayload = {
  data?: {
    subscriptionId: string;
    paypalStatus: string;
    recordStatus: string;
    nextBillingTime: string | null;
  };
  error?: string;
};

type OrderStatusPayload = {
  data?: {
    orderId: string;
    paypalStatus: string;
    recordStatus: string;
  };
  error?: string;
};

export default function SuccessContent({ kind, id }: { kind: string; id: string }) {
  const missingId = !id;

  const [statusLine, setStatusLine] = useState(
    missingId ? "No fue posible validar el pago." : "Verificando estado real con PayPal..."
  );
  const [error, setError] = useState<string | null>(missingId ? "No se recibio identificador de pago." : null);

  useEffect(() => {
    if (missingId) {
      return;
    }

    const verify = async () => {
      try {
        if (kind === "subscription") {
          const response = await fetch(`/api/paypal/subscriptions/${encodeURIComponent(id)}/status`, { cache: "no-store" });
          const payload = (await response.json().catch(() => ({}))) as SubscriptionStatusPayload;
          if (!response.ok || !payload.data) {
            throw new Error(payload.error || "No se pudo consultar la suscripcion");
          }

          const nextBillingLabel = payload.data.nextBillingTime
            ? new Date(payload.data.nextBillingTime).toLocaleString("es-ES")
            : "Pendiente";

          setStatusLine(
            `Suscripcion ${payload.data.subscriptionId} en estado ${payload.data.recordStatus}. Proximo cobro: ${nextBillingLabel}.`
          );
          return;
        }

        const response = await fetch(`/api/paypal/orders/${encodeURIComponent(id)}/status`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as OrderStatusPayload;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "No se pudo consultar la orden");
        }

        setStatusLine(`Orden ${payload.data.orderId} verificada. Estado interno: ${payload.data.recordStatus}.`);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "No se pudo verificar el estado real en PayPal";
        setError(message);
      }
    };

    void verify();
  }, [id, kind, missingId]);

  return (
    <main className="min-h-screen bg-[#030303] text-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#D4AF37]/25 bg-[#0B0B0B] p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Checkout Success</p>
        <h1 className="mt-3 text-3xl font-semibold">Confirmacion recibida</h1>
        <p className="mt-4 text-white/75">{statusLine}</p>
        <p className="mt-3 text-sm text-white/55">
          El acceso nunca se activa por llegar a esta pagina. Solo se habilita tras confirmacion real de PayPal o webhook validado.
        </p>
        {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5">Ir al dashboard</Link>
          <Link href="/checkout" className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">Volver a checkout</Link>
        </div>
      </div>
    </main>
  );
}
