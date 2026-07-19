"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CreditCard, ShieldCheck } from "lucide-react";

import { CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";
import { renderPayPalOneTimeCheckout } from "@/app/checkout/components/PayPalOneTimeCheckout";
import { renderPayPalSubscriptionCheckout } from "@/app/checkout/components/PayPalSubscriptionCheckout";
import { COMMERCIAL_PRODUCTS, resolveCheckoutProductId } from "@/app/lib/commercial/business-model";

type Product = {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  type: "one_time" | "subscription";
  features?: string[];
};

type SessionPayload = {
  authenticated?: boolean;
  user?: { id?: string; nombre?: string; apellido?: string; email?: string };
};

type CreateOrderResponse = {
  orderId: string;
};

type CaptureOrderResponse = {
  orderId: string;
  status: string;
  recordStatus: string;
};

type CreateSubscriptionResponse = {
  subscriptionId: string;
  status: string;
};

type LegalDocumentSummary = {
  slug: string;
  title: string;
  route: string;
  version: string;
};

const FALLBACK_PRODUCTS: Record<string, Product> = COMMERCIAL_PRODUCTS.filter(
  (item) => item.checkoutEnabled && item.status === "active" && item.priceUsd !== null
).reduce<Record<string, Product>>((acc, item) => {
  acc[item.checkoutId] = {
    id: item.checkoutId,
    name: item.name,
    description: item.description,
    amount: item.priceUsd ?? 0,
    currency: item.currency,
    type: item.billingType === "subscription" ? "subscription" : "one_time",
    features: item.features,
  };
  return acc;
}, {});

async function parseJsonSafe<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function scriptIdForType(type: Product["type"]): string {
  return `paypal-sdk-${type}`;
}

async function loadPayPalSdk(product: Product, clientId: string): Promise<void> {
  if (!clientId) {
    throw new Error("Falta PAYPAL_CLIENT_ID para cargar PayPal SDK");
  }

  if (typeof window === "undefined") {
    return;
  }

  const id = scriptIdForType(product.type);
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    return;
  }

  const previous = document.querySelectorAll("script[data-paypal-sdk='true']");
  previous.forEach((node) => node.parentNode?.removeChild(node));

  const params = new URLSearchParams({
    "client-id": clientId,
    currency: product.currency,
    components: "buttons",
  });

  if (product.type === "subscription") {
    params.set("vault", "true");
    params.set("intent", "subscription");
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar PayPal JavaScript SDK"));
    document.body.appendChild(script);
  });
}

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawProductId = searchParams?.get("product") ?? "plan-basic-monthly";
  const productId = resolveCheckoutProductId(rawProductId);
  const [product, setProduct] = useState<Product | null>(FALLBACK_PRODUCTS[productId] ?? null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [creatingButton, setCreatingButton] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalEnv, setPaypalEnv] = useState<"sandbox" | "production" | string>("sandbox");
  const [requiredDocuments, setRequiredDocuments] = useState<LegalDocumentSummary[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<LegalDocumentSummary[]>([]);
  const [legalChecked, setLegalChecked] = useState(false);
  const [legalSubmitting, setLegalSubmitting] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const [offeringsResponse, sessionResponse, statusResponse] = await Promise.all([
        fetch("/api/paypal/offerings", { cache: "no-store", credentials: "include" }).catch(() => null),
        fetch("/api/auth/session", { cache: "no-store", credentials: "include" }).catch(() => null),
        fetch("/api/payments/paypal/status", { cache: "no-store", credentials: "include" }).catch(() => null),
      ]);

      if (offeringsResponse?.ok) {
        const payload = await parseJsonSafe<{ data?: Product[] }>(offeringsResponse);
        const found = payload.data?.find((item) => item.id === productId);
        if (found) {
          setProduct(found);
        }
      }

      if (sessionResponse?.ok) {
        setSession(await parseJsonSafe<SessionPayload>(sessionResponse));
      }

      if (statusResponse?.ok) {
        const statusPayload = await parseJsonSafe<{ data?: { configured?: boolean; clientId?: string; env?: string } }>(statusResponse);
        if (statusPayload.data?.clientId) {
          setPaypalClientId(statusPayload.data.clientId);
        }
        if (statusPayload.data?.env) {
          setPaypalEnv(statusPayload.data.env);
        }

        if (!statusPayload.data?.configured) {
          setMessage("PayPal no esta configurado todavia en el servidor.");
        }
      } else {
        setMessage("No se pudo obtener estado de PayPal.");
      }
    };

    void load();
  }, [productId]);

  useEffect(() => {
    const loadLegalStatus = async () => {
      if (!session?.authenticated) {
        setRequiredDocuments([]);
        setMissingDocuments([]);
        setLegalChecked(false);
        return;
      }

      const response = await fetch("/api/client/compliance/acceptances", { cache: "no-store", credentials: "include" });
      const payload = await parseJsonSafe<{
        data?: {
          requiredBeforePayment?: LegalDocumentSummary[];
          missingRequiredBeforePayment?: LegalDocumentSummary[];
          canProceedToPayment?: boolean;
        };
        error?: string;
      }>(response);

      if (!response.ok || !payload.data) {
        setLegalError(payload.error || "No se pudo obtener el estado legal");
        setRequiredDocuments([]);
        setMissingDocuments([]);
        setLegalChecked(false);
        return;
      }

      const required = payload.data.requiredBeforePayment ?? [];
      const missing = payload.data.missingRequiredBeforePayment ?? [];
      setRequiredDocuments(required);
      setMissingDocuments(missing);
      setLegalChecked(Boolean(payload.data.canProceedToPayment));
    };

    void loadLegalStatus();
  }, [session?.authenticated]);

  const acceptRequiredLegalDocuments = async () => {
    setLegalSubmitting(true);
    setLegalError(null);

    try {
      const response = await fetch("/api/client/compliance/acceptances", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentSlugs: requiredDocuments.map((doc) => doc.slug) }),
      });

      const payload = await parseJsonSafe<{
        data?: {
          missingRequiredBeforePayment?: LegalDocumentSummary[];
          canProceedToPayment?: boolean;
        };
        error?: string;
      }>(response);

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "No se pudo registrar la aceptacion legal");
      }

      const missing = payload.data.missingRequiredBeforePayment ?? [];
      setMissingDocuments(missing);
      setLegalChecked(Boolean(payload.data.canProceedToPayment));
    } catch (error) {
      setLegalError(error instanceof Error ? error.message : "No se pudo registrar la aceptacion legal");
    } finally {
      setLegalSubmitting(false);
    }
  };

  const summaryItems = useMemo(() => product?.features ?? [], [product]);
  const checkoutLabel = paypalEnv === "production" ? "Checkout oficial PayPal Live" : "Checkout oficial PayPal Sandbox";

  useEffect(() => {
    const container = buttonContainerRef.current;
    if (!product || !session?.authenticated || !container || !paypalClientId || !legalChecked || missingDocuments.length > 0) {
      if (container) {
        container.innerHTML = "";
      }
      setSdkReady(false);
      return;
    }

    let mounted = true;

    const renderButtons = async () => {
      setCreatingButton(true);
      setMessage(null);

      try {
        await loadPayPalSdk(product, paypalClientId);
        if (!mounted) {
          return;
        }

        container.innerHTML = "";

        const createOrder = async () => {
          const response = await fetch("/api/payments/paypal/orders", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          });

          const payload = await parseJsonSafe<{ data?: CreateOrderResponse; error?: string }>(response);
          if (!response.ok || !payload.data?.orderId) {
            throw new Error(payload.error || "No se pudo crear orden PayPal");
          }

          return payload.data.orderId;
        };

        const createSubscription = async () => {
          const response = await fetch("/api/payments/paypal/subscriptions", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          });

          const payload = await parseJsonSafe<{ data?: CreateSubscriptionResponse; error?: string }>(response);
          if (!response.ok || !payload.data?.subscriptionId) {
            throw new Error(payload.error || "No se pudo crear suscripcion PayPal");
          }

          return payload.data.subscriptionId;
        };

        const onApprove = async (data: Record<string, unknown>) => {
          try {
            if (product.type === "one_time") {
              const orderID = String(data.orderID || "");
              const response = await fetch(`/api/payments/paypal/orders/${encodeURIComponent(orderID)}/capture`, {
                method: "POST",
                credentials: "include",
              });

              const payload = await parseJsonSafe<{ data?: CaptureOrderResponse; error?: string }>(response);
              if (!response.ok || !payload.data) {
                throw new Error(payload.error || "No se pudo capturar la orden");
              }

              router.push(`/checkout/success?kind=order&id=${encodeURIComponent(payload.data.orderId)}`);
              return;
            }

            const subscriptionID = String(data.subscriptionID || "");
            router.push(`/checkout/success?kind=subscription&id=${encodeURIComponent(subscriptionID)}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "No se pudo confirmar PayPal";
            router.push(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
          }
        };

        const onCancel = () => {
          router.push(`/checkout/cancel?product=${encodeURIComponent(product.id)}`);
        };

        const onError = (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : "Error en PayPal SDK";
          router.push(`/checkout/error?message=${encodeURIComponent(errorMessage)}`);
        };

        if (product.type === "one_time") {
          await renderPayPalOneTimeCheckout({
            containerSelector: "#paypal-button-container",
            createOrder,
            onApprove,
            onCancel,
            onError,
          });
        } else {
          await renderPayPalSubscriptionCheckout({
            containerSelector: "#paypal-button-container",
            createSubscription,
            onApprove,
            onCancel,
            onError,
          });
        }

        if (mounted) {
          setSdkReady(true);
        }
      } catch (error) {
        if (mounted) {
          setSdkReady(false);
          setMessage(error instanceof Error ? error.message : "No se pudo inicializar PayPal");
        }
      } finally {
        if (mounted) {
          setCreatingButton(false);
        }
      }
    };

    void renderButtons();

    return () => {
      mounted = false;
      container.innerHTML = "";
    };
  }, [legalChecked, missingDocuments.length, paypalClientId, product, router, session?.authenticated]);

  const paymentLabel = product?.type === "subscription" ? "al mes" : "pago unico";

  if (!product) {
    return <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">Producto no disponible</div>;
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-[linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">{checkoutLabel}</p>
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
              <p>Proteccion: <span className="text-white">Activacion solo por confirmacion real de PayPal</span></p>
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
            <p className="mt-4 text-4xl font-bold text-white">{product.amount.toLocaleString()} {product.currency}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/60">{paymentLabel}</p>
            <p className="mt-2 text-sm text-white/60">
              El acceso solo se activa despues de captura confirmada o webhook validado con firma oficial PayPal.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <p className="font-semibold text-white">Aceptacion legal obligatoria previa al pago</p>
              <p className="mt-1 text-white/70">Debes aceptar las versiones activas de documentos legales antes de habilitar el boton de pago.</p>
              <ul className="mt-3 space-y-1 text-xs text-white/70">
                {requiredDocuments.map((doc) => (
                  <li key={doc.slug} className="flex items-center justify-between gap-3">
                    <Link href={doc.route} className="underline">{doc.title}</Link>
                    <span>v{doc.version}</span>
                  </li>
                ))}
              </ul>
              {missingDocuments.length > 0 && (
                <p className="mt-3 text-xs text-yellow-300">
                  Faltan {missingDocuments.length} aceptaciones para continuar con el pago.
                </p>
              )}
              {legalChecked && (
                <p className="mt-3 text-xs text-green-300">Aceptacion legal al dia. Puedes continuar con el pago.</p>
              )}
              {!legalChecked && session?.authenticated && requiredDocuments.length > 0 && (
                <div className="mt-3">
                  <CARVIPIXButton
                    variant="secondary"
                    size="sm"
                    onClick={() => void acceptRequiredLegalDocuments()}
                    isLoading={legalSubmitting}
                  >
                    Aceptar documentos legales vigentes
                  </CARVIPIXButton>
                </div>
              )}
              {legalError && <p className="mt-2 text-xs text-red-300">{legalError}</p>}
            </div>

            <div className="mt-6 space-y-3">
              <>
                <div id="paypal-button-container" ref={buttonContainerRef} className="min-h-[50px]" />
                {(creatingButton || !sdkReady) && session?.authenticated && legalChecked && missingDocuments.length === 0 && (
                  <p className="text-xs text-white/60">Preparando boton oficial de PayPal...</p>
                )}
              </>
              <Link href="/dashboard">
                <CARVIPIXButton variant="ghost" fullWidth>Ir al panel cliente</CARVIPIXButton>
              </Link>
            </div>

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
