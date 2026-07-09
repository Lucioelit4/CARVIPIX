"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CreditCard, ShieldCheck } from "lucide-react";

import { CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features?: string[];
};

type Order = {
  id: string;
  productId: string;
  total: number;
  currency: string;
  status: string;
};

type PaymentOrderResponse = {
  id: string;
  status: string;
  total: { amount: number; currency: string };
};

type CheckoutSessionResponse = {
  orderId: string;
  status: string;
  provider: string;
  providerCheckoutId: string;
  checkoutUrl: string;
  expiresAt: string;
};

type SessionPayload = {
  authenticated?: boolean;
  user?: { nombre?: string; apellido?: string; email?: string };
};

const FALLBACK_PRODUCTS: Record<string, Product> = {
  "plan-basic": {
    id: "plan-basic",
    name: "Plan BASIC",
    description: "Alertas manuales, pares limitados, historial limitado y bot limitado.",
    price: 49,
    currency: "USD",
    features: ["5 alertas/dia", "4 pares", "1 bot"],
  },
  "plan-advanced": {
    id: "plan-advanced",
    name: "Plan ADVANCED",
    description: "Mas pares, mas alertas, mas historial y bot completo.",
    price: 149,
    currency: "USD",
    features: ["25 alertas/dia", "12 pares", "3 bots"],
  },
  "bot-carvipix-license": {
    id: "bot-carvipix-license",
    name: "Licencia Bot CARVIPIX",
    description: "Licencia comercial con activacion y conexion preparada.",
    price: 999,
    currency: "USD",
    features: ["Licencia activa", "Diagnostico", "Conexion broker sujeta a activacion"],
  },
  "capital-gestionado": {
    id: "capital-gestionado",
    name: "Gestion de Capital",
    description: "Solicitud y seguimiento de servicio separado de capital.",
    price: 10000,
    currency: "USD",
    features: ["Solicitud", "Contrato", "Dashboard", "Reportes"],
  },
};

const LEGACY_PRODUCT_ALIASES: Record<string, string> = {
  membership: "plan-basic",
  bot: "bot-carvipix-license",
  capital: "capital-gestionado",
};

async function parseJsonSafe<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export default function CheckoutContent() {
  const searchParams = useSearchParams();
  const rawProductId = searchParams?.get("product") ?? "plan-basic";
  const productId = LEGACY_PRODUCT_ALIASES[rawProductId] ?? rawProductId;
  const [product, setProduct] = useState<Product | null>(FALLBACK_PRODUCTS[productId] ?? null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (rawProductId === "fondeo") {
      window.location.replace("/soporte");
      return;
    }

    const load = async () => {
      const [paymentsResponse, sessionResponse] = await Promise.all([
        fetch(`/api/client/payments?productId=${encodeURIComponent(productId)}`, { cache: "no-store" }).catch(() => null),
        fetch("/api/auth/session", { cache: "no-store" }).catch(() => null),
      ]);

      if (paymentsResponse?.ok) {
        const payload = await parseJsonSafe<{ data?: { product?: Product | null } }>(paymentsResponse);
        if (payload.data?.product) {
          setProduct(payload.data.product);
        }
      }

      if (sessionResponse?.ok) {
        setSession(await parseJsonSafe<SessionPayload>(sessionResponse));
      }
    };

    void load();
  }, [productId, rawProductId]);

  const summaryItems = useMemo(() => product?.features ?? [], [product]);

  const handlePurchase = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const idempotencyKey = `checkout-${productId}-${Date.now()}`;
      const createResponse = await fetch("/api/client/payment-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          paymentMethodRequested: "card_credit",
          providerPreferred: "mercadopago",
          idempotencyKey,
        }),
      });
      const createPayload = await parseJsonSafe<{ data?: PaymentOrderResponse; error?: string }>(createResponse);
      if (!createResponse.ok || !createPayload.data) {
        throw new Error(createPayload.error || "No se pudo crear la orden");
      }

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("checkoutStatus", "return");
      currentUrl.searchParams.set("orderId", createPayload.data.id);

      const cancelUrl = new URL(window.location.href);
      cancelUrl.searchParams.set("checkoutStatus", "cancelled");

      const sessionResponse = await fetch(`/api/client/payment-orders/${encodeURIComponent(createPayload.data.id)}/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: currentUrl.toString(),
          cancelUrl: cancelUrl.toString(),
        }),
      });
      const sessionPayload = await parseJsonSafe<{ data?: CheckoutSessionResponse; error?: string }>(sessionResponse);
      if (!sessionResponse.ok || !sessionPayload.data) {
        throw new Error(sessionPayload.error || "No se pudo iniciar el checkout del proveedor");
      }

      setCreatedOrder({
        id: createPayload.data.id,
        productId,
        total: createPayload.data.total.amount,
        currency: createPayload.data.total.currency,
        status: createPayload.data.status,
      });
      setMessage(`Orden ${createPayload.data.id} creada. Redirigiendo al checkout del proveedor (${sessionPayload.data.provider})...`);
      window.location.assign(sessionPayload.data.checkoutUrl);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo completar la compra");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">Producto no disponible</div>;
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-[linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Checkout oficial</p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-white/65">{product.description}</p>
        </section>

        {!session?.authenticated && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Debes iniciar sesion como cliente antes de comprar. <Link href="/login" className="underline">Ir a login</Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <CARVIPIXCard variant="admin" padding="16" hover={false}>
            <h2 className="text-xl font-semibold mb-4">Resumen del producto</h2>
            <div className="space-y-3 text-sm text-white/70">
              <p>Cliente: <span className="text-white">{session?.user?.nombre ? `${session.user.nombre ?? ""} ${session.user.apellido ?? ""}`.trim() : "Sesion requerida"}</span></p>
              <p>Email: <span className="text-white">{session?.user?.email ?? "Inicia sesion para continuar"}</span></p>
              <p>Proteccion: <span className="text-white">Validacion backend y auditoria comercial activa</span></p>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              {summaryItems.map((feature) => (
                <li key={feature} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#D4AF37]" />{feature}</li>
              ))}
            </ul>
          </CARVIPIXCard>

          <CARVIPIXCard variant="premium" padding="16" hover={false}>
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <CreditCard className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Pago</h2>
            </div>
            <p className="mt-4 text-4xl font-bold text-white">{product.price.toLocaleString()} {product.currency}</p>
            <p className="mt-2 text-sm text-white/60">La compra crea una orden comercial y solicita una sesión real del proveedor cuando la infraestructura de pagos está conectada.</p>
            <div className="mt-6 space-y-3">
              <CARVIPIXButton variant="premium" fullWidth disabled={!session?.authenticated || submitting} onClick={() => void handlePurchase()}>
                {submitting ? "Procesando..." : "Comprar ahora"}
              </CARVIPIXButton>
              <Link href="/dashboard">
                <CARVIPIXButton variant="ghost" fullWidth>Ir al panel cliente</CARVIPIXButton>
              </Link>
            </div>
            {createdOrder && <p className="mt-4 text-xs text-white/60">Orden creada: {createdOrder.id}</p>}
            {message && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80 flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-[#D4AF37]" />
                <span>{message}</span>
              </div>
            )}
          </CARVIPIXCard>
        </div>
      </div>
    </main>
  );
}
