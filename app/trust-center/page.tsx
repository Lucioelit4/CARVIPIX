import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { TRUST_MODULES } from "./config";
import { TRUST_EVIDENCE_ITEMS, TRUST_TIMELINE } from "./trust-registry";
import { buildTrustMetricsSnapshot } from "./trust-metrics";

export const metadata: Metadata = {
  title: "CARVIPIX Transparency & Trust Center",
  description:
    "Sistema vivo de transparencia y confianza de CARVIPIX con score, cronologia, evidencia verificable y estado operativo publico.",
  alternates: { canonical: "https://carvipix.com/trust-center" },
};

export default function TrustCenterPage() {
  const snapshot = buildTrustMetricsSnapshot();
  const recentTimeline = TRUST_TIMELINE.slice(-4).reverse();
  const recentEvidence = TRUST_EVIDENCE_ITEMS.slice(0, 4);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#030303] text-white">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="rounded-3xl border border-white/10 bg-[#0B1220]/95 p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            <ShieldCheck size={14} />
            CARVIPIX Transparency & Trust Center
          </div>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Infraestructura viva de confianza</h1>
          <p className="mt-4 max-w-3xl text-base text-zinc-300 sm:text-lg">
            Este centro no es un conjunto de paginas. Es un sistema vivo con estado, evidencia y trazabilidad para mostrar como opera CARVIPIX
            en tiempo real y con integridad documental.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Trust Score</p>
            <p className="mt-2 text-4xl font-bold text-emerald-100">{snapshot.trustScore}%</p>
            <p className="mt-2 text-sm text-emerald-100/85">
              {snapshot.verifiedItems} de {snapshot.totalEvidenceItems} evidencias verificadas. Ultima actualizacion: {new Date(snapshot.generatedAt).toLocaleString("es-MX")}.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {snapshot.scoreCards.map((card) => (
                <div key={card.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-white/70">{card.label}</p>
                  <p className={`mt-1 text-sm font-semibold ${card.ok ? "text-emerald-300" : "text-amber-300"}`}>
                    {card.ok ? "VERIFICADO" : "PENDIENTE"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">Numeros</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>Trayectoria: {snapshot.timelineSpanYears}+ anos</p>
              <p>Eventos cronologicos: {snapshot.timelineEvents}</p>
              <p>Evidencias pendientes: {snapshot.pendingItems}</p>
            </div>
            <Link href="/trust-center/numeros" className="mt-4 inline-flex text-sm font-semibold text-[#D4AF37] hover:underline">
              Ver todos los numeros
            </Link>
          </article>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Cronologia 2019-2026</h2>
              <Link href="/trust-center/cronologia" className="text-sm font-semibold text-[#D4AF37] hover:underline">
                Ver completa
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentTimeline.map((event) => (
                <div key={`${event.year}-${event.title}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">{event.year}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-zinc-400">{event.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Centro de evidencias</h2>
              <Link href="/trust-center/respaldos" className="text-sm font-semibold text-[#D4AF37] hover:underline">
                Abrir repositorio
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentEvidence.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className={`text-xs font-semibold ${item.status === "verified" ? "text-emerald-300" : "text-amber-300"}`}>
                      {item.status === "verified" ? "VERIFICADO" : "PENDIENTE"}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TRUST_MODULES.map((item) => (
            <article key={item.href} className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
              <h2 className="text-lg font-semibold text-white">{item.label}</h2>
              <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-[#D4AF37]/30 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
              >
                Ver modulo
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
