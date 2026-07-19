import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, BarChart3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Resultados — CARVIPIX",
  description:
    "Estado real del módulo de resultados CARVIPIX, flujo de datos y acceso al panel privado para métricas operativas.",
};

const points = [
  {
    title: "Fuente operativa",
    body:
      "Los resultados se calculan a partir de operaciones registradas y eventos de la plataforma. No se publican cifras de ejemplo en esta vista pública.",
    icon: ShieldCheck,
  },
  {
    title: "Cadena de trazabilidad",
    body:
      "Trading Engine, señal, alerta, historial y resultado se conservan con trazas de auditoría para revisión administrativa y del cliente.",
    icon: Activity,
  },
  {
    title: "Acceso por sesión",
    body:
      "El detalle cuantitativo de resultados y operaciones está disponible dentro del dashboard con sesión activa y permisos del plan correspondiente.",
    icon: BarChart3,
  },
];

export default function ResultadosServicioPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] px-6 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Resultados CARVIPIX
          </p>
          <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Resultados y trazabilidad operativa</h1>
          <p className="mt-4 max-w-3xl text-base text-white/70 sm:text-lg">
            Esta sección pública explica cómo se construye el resultado en CARVIPIX sin mostrar métricas simuladas. El detalle numérico se consulta en tu panel privado.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?next=/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black hover:bg-[#E4C35A]">
              Entrar al Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link href="/servicios" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/5">
              Ver servicios
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-12 sm:px-8 md:grid-cols-3">
        {points.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0B1220]/90 p-6">
              <div className="inline-flex rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2 text-[#D4AF37]">
                <Icon size={18} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-white/70">{item.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
