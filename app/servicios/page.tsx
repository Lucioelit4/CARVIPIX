import type { Metadata } from "next";
import { ArrowRight, BarChart3, Bot, ShieldCheck, Crown, Users, CheckCircle2 } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";
import { COMMERCIAL_PRODUCTS } from "@/app/lib/commercial/business-model";

export const metadata: Metadata = {
  title: "Servicios y Planes — CARVIPIX",
  description: "Planes BASIC, PRO y Bot EA MT5 de CARVIPIX. Alertas en vivo, herramientas de trading y automatización profesional.",
  alternates: { canonical: "https://carvipix.com/servicios" },
  openGraph: {
    title: "Servicios y Planes — CARVIPIX",
    url: "https://carvipix.com/servicios",
  },
};

const services = [
  {
    title: "Alertas en Vivo",
    description: COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-basic")?.description ?? "",
    price: `${COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-basic")?.priceUsd?.toFixed(2)} USD / mes`,
    benefits: COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-basic")?.features ?? [],
    href: "/login?next=/alertas",
    checkout: "/checkout?product=plan-basic",
    ctaLabel: "Comprar ahora",
    icon: BarChart3,
  },
  {
    title: "Bot CARVIPIX",
    description:
      "Licencia única para automatizar en MT5 las señales incluidas en tu membresía CARVIPIX. La cantidad de operaciones y los pares disponibles dependen del plan BASIC o PRO que tengas activo.",
    price: `${COMMERCIAL_PRODUCTS.find((item) => item.id === "bot-carvipix-license")?.priceUsd?.toFixed(0)} USD`,
    benefits: [
      "Pago único",
      "Licencia oficial de uso",
      "Automatización según tu membresía activa",
      "BASIC: XAUUSD y BTCUSD, hasta 2–7 operaciones al día",
      "PRO: XAUUSD, BTCUSD, EURUSD y GBPUSD, hasta 5–25 operaciones al día",
      "Operaciones solo cuando existan oportunidades válidas",
      "Entrega por correo con archivo, manual e instrucciones",
      "Instalación guiada para MT5",
      "Soporte de activación",
    ],
    href: "/servicios/bot",
    checkout: "/checkout?product=bot-carvipix-license",
    ctaLabel: "Comprar ahora",
    icon: Bot,
  },
  {
    title: "Plan Pro",
    description: COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-advanced")?.description ?? "",
    price: `${COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-advanced")?.priceUsd?.toFixed(2)} USD / mes`,
    benefits: COMMERCIAL_PRODUCTS.find((item) => item.id === "plan-advanced")?.features ?? [],
    href: "/login?next=/alertas",
    checkout: "/checkout?product=plan-advanced",
    ctaLabel: "Comprar ahora",
    icon: ShieldCheck,
  },
  {
    title: "Socios Estratégicos",
    description: COMMERCIAL_PRODUCTS.find((item) => item.id === "socios-estrategicos")?.description ?? "",
    price: "Evaluación privada",
    benefits: COMMERCIAL_PRODUCTS.find((item) => item.id === "socios-estrategicos")?.features ?? [],
    href: "/socios-estrategicos",
    checkout: "/socios-estrategicos/solicitud",
    ctaLabel: "Solicitar evaluación",
    icon: Crown,
  },
  {
    title: "Cuentas Fondeadas",
    description:
      "Te ayudamos a prepararte y avanzar en el challenge de tu cuenta de fondeo con estructura, gestión de riesgo y acompañamiento CARVIPIX.",
    price: "Próximamente",
    benefits: [
      "Preparación para challenge",
      "Plan de gestión de riesgo",
      "Seguimiento del proceso",
      "Apoyo para cumplir las reglas de la fondeadora",
      "Próximamente",
    ],
    href: "/servicios/fondeo",
    checkout: "/servicios/fondeo",
    ctaLabel: "Ver estado",
    icon: ShieldCheck,
  },
  {
    title: "Academia",
    description: COMMERCIAL_PRODUCTS.find((item) => item.id === "academia")?.description ?? "",
    price: "Próximamente",
    benefits: COMMERCIAL_PRODUCTS.find((item) => item.id === "academia")?.features ?? [],
    href: "/servicios/academia",
    checkout: "/servicios/academia",
    ctaLabel: "Ver estado",
    icon: Users,
  },
];

export default function ServiciosPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            SERVICIOS Y MEMBRESÍAS
          </p>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl">
            Todo CARVIPIX en un solo lugar
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/70 sm:text-lg">
            Elige la membresía, el Bot o el servicio que mejor se adapte a tu forma de operar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CARVIPIXButtonLink href="/" variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Inicio
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/dashboard" variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Workspace
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/login" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Iniciar sesión
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/registro" variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Crear cuenta
            </CARVIPIXButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className="rounded-[1.75rem] border border-white/10 bg-[#0B1220]/95 p-6 shadow-2xl shadow-black/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {service.price}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{service.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">{service.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/75">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#D4AF37]" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <CARVIPIXButtonLink href={service.href} variant="secondary" size="md">
                    Ver detalle
                  </CARVIPIXButtonLink>
                  <CARVIPIXButtonLink href={service.checkout} variant="primary" size="md">
                    {service.ctaLabel}
                  </CARVIPIXButtonLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
