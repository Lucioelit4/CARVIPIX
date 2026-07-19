import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, Crown, ShieldCheck, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Socios Estrategicos CARVIPIX",
  description:
    "Programa privado de Socios Estrategicos CARVIPIX para colaboraciones comerciales y de comunidad.",
  alternates: { canonical: "https://carvipix.com/socios-estrategicos" },
};

const pillars = [
  {
    icon: Crown,
    title: "Exclusividad real",
    text: "Cupos limitados y evaluacion individual para preservar la calidad comercial de cada colaboracion.",
  },
  {
    icon: Building2,
    title: "Enfoque empresarial",
    text: "Buscamos empresas, marcas y comunidades consolidadas con vision de largo plazo.",
  },
  {
    icon: ShieldCheck,
    title: "Gobernanza y reputacion",
    text: "Cada perfil se revisa por criterios de calidad, trayectoria y alineacion con la marca CARVIPIX.",
  },
];

const requirements = [
  "Experiencia comprobable en liderazgo de comunidad o direccion comercial.",
  "Canales digitales activos con audiencia real y trazable.",
  "Comunicacion profesional, clara y alineada con la identidad CARVIPIX.",
  "Disponibilidad para colaborar bajo procesos internos y evaluacion formal.",
];

const benefits = [
  "Acceso preferente a coordinacion comercial privada.",
  "Prioridad en procesos de colaboracion de alto impacto.",
  "Ruta de crecimiento para alianzas oficiales por etapas.",
  "Soporte de relacion estrategica con estandar premium.",
];

export default function SociosEstrategicosPage() {
  return (
    <main className="min-h-screen bg-[#040404] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(215,185,102,0.22),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(34,87,122,0.2),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#E1C26F]">
            <Sparkles size={14} />
            Programa Privado
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            Socios Estrategicos CARVIPIX
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
            Esta seccion esta orientada a perfiles empresariales y lideres de comunidad con criterio profesional.
            No es un programa abierto, ni de reclutamiento masivo, ni una oferta de inversion. Es un proceso privado
            de evaluacion comercial para posibles colaboraciones con CARVIPIX.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/socios-estrategicos/solicitud"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#E8C96D]"
            >
              Solicitar evaluacion
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
            >
              Volver a servicios
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 md:py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-6">
                <div className="inline-flex rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-xl font-semibold">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">{pillar.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 sm:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#101010_0%,#0A0A0A_100%)] p-7 md:grid-cols-2 md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">Perfil buscado</p>
            <h3 className="mt-3 text-3xl font-semibold">Aliados con criterio comercial y reputacion</h3>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <BriefcaseBusiness size={16} className="mt-0.5 text-[#D4AF37]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">Beneficios y alcance</p>
            <h3 className="mt-3 text-3xl font-semibold">Colaboracion comercial de largo plazo</h3>
            <ul className="mt-6 space-y-3 text-sm text-white/75">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Users size={16} className="mt-0.5 text-[#D4AF37]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 p-4 text-sm text-white/80">
              <p className="font-semibold text-[#E7C975]">Proceso de evaluacion</p>
              <p className="mt-2">
                1) Recepcion de solicitud. 2) Revision interna del perfil. 3) Solicitud de informacion adicional si aplica.
                4) Aprobacion para contacto o cierre de proceso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 sm:px-8 md:pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Cupos limitados</p>
          <h3 className="mt-4 text-3xl font-semibold">Cada solicitud es revisada por el equipo interno</h3>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/70">
            CARVIPIX se reserva el derecho de aceptar o rechazar cualquier solicitud, sin obligacion de expresar las
            razones de su decision. La aprobacion de una solicitud no constituye una relacion laboral, societaria,
            financiera ni contractual hasta que ambas partes firmen el acuerdo correspondiente.
          </p>
          <Link
            href="/socios-estrategicos/solicitud"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-7 py-3 text-sm font-bold text-black transition hover:bg-[#E8C96D]"
          >
            Solicitar evaluacion
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
