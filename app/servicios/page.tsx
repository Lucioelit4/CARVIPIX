import { ArrowRight, BarChart3, Bot, ShieldCheck, Wallet, Users, CheckCircle2 } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";

const services = [
  {
    title: "Alertas en Vivo",
    description: "Señales y seguimiento operativo en tiempo real con foco en gestión de riesgo.",
    price: "Desde 99 USD",
    benefits: ["Alertas estratégicas", "Seguimiento operativo", "Acceso rápido al panel"],
    href: "/servicios/alertas",
    checkout: "/checkout?product=membership",
    icon: BarChart3,
  },
  {
    title: "Bot CARVIPIX",
    description: "Automatización premium para MT4/MT5 con reglas operativas y control estructurado.",
    price: "999 USD",
    benefits: ["Pago único", "MT4 / MT5", "Soporte prioritario"],
    href: "/servicios/bot",
    checkout: "/checkout?product=bot",
    icon: Bot,
  },
  {
    title: "Gestión de Capital",
    description: "Proceso privado de capital gestionado con reportes y participación alineada.",
    price: "Desde 10,000 USD",
    benefits: ["Seguimiento privado", "Reportes claros", "Control de riesgo"],
    href: "/servicios/capital",
    checkout: "/checkout?product=capital",
    icon: Wallet,
  },
  {
    title: "Cuenta Fondeada",
    description: "Acompañamiento en evaluación y seguimiento con empresas externas de fondeo.",
    price: "5,000 USD",
    benefits: ["Revisión inicial", "Acompañamiento", "Entrega de credenciales"],
    href: "/servicios/fondeo",
    checkout: "/checkout?product=fondeo",
    icon: ShieldCheck,
  },
  {
    title: "Comunidad Privada",
    description: "Espacio interno para seguimiento, soporte y convivencia moderada.",
    price: "Incluida en planes",
    benefits: ["Chat privado", "Moderación", "Apoyo continuo"],
    href: "/servicios/comunidad",
    checkout: "/checkout?product=membership",
    icon: Users,
  },
];

export default function ServiciosPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Servicios y membresías
          </p>
          <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl">
            Elige tu plan y accede a CARVIPIX.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/70 sm:text-lg">
            Esta es la página comercial para usuarios sin membresía activa. Aquí puedes revisar cada servicio, ver beneficios, precios y avanzar al checkout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
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
                    Comprar ahora
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
