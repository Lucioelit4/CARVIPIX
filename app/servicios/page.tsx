import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Bot, ShieldCheck, Crown, Users, CheckCircle2 } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";
import { COMMERCIAL_PRODUCTS } from "@/app/lib/commercial/business-model";
import InstallTraderButton from "@/app/components/pwa/InstallTraderButton";
import RevealOnScroll from "@/app/components/RevealOnScroll";

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
  const membershipsAndAutomation = ["Alertas en Vivo", "Bot CARVIPIX", "Plan Pro"];
  const ecosystemServices = ["Socios Estratégicos", "Cuentas Fondeadas", "Academia"];

  const topBlockServices = membershipsAndAutomation
    .map((title) => services.find((service) => service.title === title))
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  const ecosystemBlockServices = ecosystemServices
    .map((title) => services.find((service) => service.title === title))
    .filter((service): service is NonNullable<typeof service> => Boolean(service));

  return (
    <main className="min-h-screen bg-[#020305] text-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.12),_transparent_45%),radial-gradient(circle_at_top_left,_rgba(26,55,96,0.45),_transparent_52%),linear-gradient(180deg,#06080F_0%,#020305_100%)] py-14 sm:py-18">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-0 right-0 top-[26%] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
          <div className="absolute left-0 right-0 top-[64%] h-px bg-gradient-to-r from-transparent via-[#285B9C]/40 to-transparent" />
        </div>

        <RevealOnScroll className="relative w-full">
          <div className="relative aspect-[7/4] min-h-[760px] overflow-hidden bg-[#02070F] sm:min-h-[580px] lg:min-h-[620px]">
            <img
              src="/media/servicios/carvipix-hero-mercados.png"
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-center"
              aria-hidden="true"
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(2, 7, 15, 0.95) 0%, rgba(2, 7, 15, 0.55) 12%, rgba(2, 7, 15, 0.12) 25%, transparent 38%, transparent 70%, rgba(2, 7, 15, 0.22) 82%, rgba(2, 7, 15, 0.80) 100%)",
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(2, 7, 15, 0.98) 0%, rgba(2, 7, 15, 0.88) 32%, rgba(2, 7, 15, 0.38) 58%, rgba(2, 7, 15, 0.05) 82%, transparent 100%)",
              }}
            />

            <div className="relative z-10 flex h-full items-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
              <div className="max-w-[18rem] sm:max-w-2xl">
                <p className="inline-flex rounded-full border border-[#D4AF37]/55 bg-black/45 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#F6D878] shadow-[0_12px_28px_-18px_rgba(212,175,55,0.85)] sm:text-sm">
                  PLATAFORMA CARVIPIX
                </p>
                <h1 className="mt-6 break-words text-[2.5rem] font-semibold leading-tight text-white sm:break-normal sm:text-5xl lg:text-[4.15rem]">
                  Tecnología, análisis y automatización para operar con mayor control
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  Conoce el ecosistema CARVIPIX: alertas en vivo, automatización, herramientas profesionales y servicios diseñados para acompañar tu evolución en los mercados.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <CARVIPIXButtonLink href="/registro" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Crear cuenta
                  </CARVIPIXButtonLink>
                  <CARVIPIXButtonLink href="/login" variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
                    Iniciar sesión
                  </CARVIPIXButtonLink>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/60">
                  <Link href="/" className="transition hover:text-white/90">
                    Inicio
                  </Link>
                  <Link href="/dashboard" className="transition hover:text-white/90">
                    Workspace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-12">
        <RevealOnScroll className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(10,14,24,0.96),rgba(4,6,10,0.94))] p-6 shadow-[0_28px_70px_-45px_rgba(212,175,55,0.6)] sm:p-8" delayMs={60}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Instalación oficial</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Lleva CARVIPIX contigo</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
                Accede a tus alertas y herramientas desde cualquier dispositivo.
              </p>
            </div>
            <div className="shrink-0">
              <InstallTraderButton label="Instalar CARVIPIX" />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6 sm:px-8">
        <RevealOnScroll className="max-w-3xl" delayMs={90}>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Descubre todo lo que CARVIPIX pone a tu alcance</h2>
          <p className="mt-4 text-base text-white/70 sm:text-lg">
            Explora nuestras membresías, herramientas de automatización y servicios complementarios.
          </p>
        </RevealOnScroll>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">Membresías y automatización</h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {topBlockServices.map((service) => {
            const Icon = service.icon;
            const isBot = service.title === "Bot CARVIPIX";
            const isPro = service.title === "Plan Pro";

            return (
              <RevealOnScroll
                key={service.title}
                delayMs={service.title === "Bot CARVIPIX" ? 30 : 0}
                className={`group relative overflow-hidden rounded-[1.75rem] border bg-[linear-gradient(170deg,rgba(12,20,33,0.97),rgba(6,10,17,0.96))] p-6 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.9)] transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_30px_75px_-40px_rgba(16,35,60,0.85)] motion-reduce:transform-none ${
                  isBot
                    ? "border-[#D4AF37]/45 shadow-[0_38px_90px_-44px_rgba(212,175,55,0.55)] lg:scale-[1.02]"
                    : "border-white/10"
                }`}
              >
                {isBot ? <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_55%)]" /> : null}

                <div className="relative flex items-start justify-between gap-4">
                  <div className={`inline-flex rounded-2xl border p-3 text-[#D4AF37] transition-transform duration-500 motion-safe:group-hover:-translate-y-0.5 ${isBot ? "border-[#D4AF37]/40 bg-[#D4AF37]/12" : "border-[#D4AF37]/20 bg-[#D4AF37]/10"}`}>
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {service.price}
                  </span>
                </div>

                {isPro ? (
                  <p className="relative mt-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                    Membresía más completa
                  </p>
                ) : null}

                <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#0D1A2B] via-[#09111D] to-[#060A12]">
                  <div className="absolute inset-0 border border-dashed border-[#D4AF37]/30" />
                </div>

                <h2 className="relative mt-5 text-2xl font-semibold text-white">{service.title}</h2>
                <p className="relative mt-3 text-sm leading-6 text-white/65">{service.description}</p>
                <ul className="relative mt-5 space-y-2 text-sm text-white/75">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#D4AF37]" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-6 flex flex-col gap-3">
                  <CARVIPIXButtonLink href={service.href} variant="secondary" size="md">
                    Ver detalle
                  </CARVIPIXButtonLink>
                  <CARVIPIXButtonLink href={service.checkout} variant="primary" size="md">
                    {service.ctaLabel}
                  </CARVIPIXButtonLink>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">Ecosistema CARVIPIX</h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {ecosystemBlockServices.map((service) => {
            const Icon = service.icon;

            return (
              <RevealOnScroll className="group rounded-[1.75rem] border border-white/10 bg-[linear-gradient(170deg,rgba(10,16,26,0.96),rgba(5,9,15,0.95))] p-6 shadow-[0_25px_65px_-50px_rgba(0,0,0,0.9)] transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_26px_75px_-42px_rgba(16,35,60,0.82)] motion-reduce:transform-none" key={service.title}>
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-transform duration-500 motion-safe:group-hover:-translate-y-0.5">
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                    {service.price}
                  </span>
                </div>

                <div className="mt-5 aspect-[16/9] overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#0C1828] via-[#08111D] to-[#050910]">
                  <div className="h-full w-full border border-dashed border-[#D4AF37]/25" />
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
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 sm:px-8 sm:pb-20">
        <RevealOnScroll className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(8,13,22,0.98),rgba(4,7,12,0.95))] p-8 shadow-[0_34px_84px_-48px_rgba(0,0,0,0.9)] sm:p-10" delayMs={120}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Acceso al ecosistema</p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Comienza tu experiencia CARVIPIX</h2>
          <p className="mt-4 max-w-3xl text-base text-white/75 sm:text-lg">
            Crea tu cuenta y accede a una plataforma diseñada para mantener tus herramientas, alertas y servicios en un solo entorno.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Crear cuenta
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/login" variant="secondary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Ya tengo una cuenta
            </CARVIPIXButtonLink>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
