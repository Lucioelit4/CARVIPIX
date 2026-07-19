import type { Metadata } from "next";
import { buildTrustMetricsSnapshot } from "../trust-metrics";

export const metadata: Metadata = {
  title: "Numeros verificables | CARVIPIX Transparency & Trust Center",
  description: "Indicadores publicos construidos solo con datos y estados verificables del Trust Center.",
};

export default function TrustCenterNumerosPage() {
  const snapshot = buildTrustMetricsSnapshot();

  const cards = [
    { label: "Trust Score", value: `${snapshot.trustScore}%`, note: "Basado en evidencia verificada" },
    { label: "Evidencias verificadas", value: String(snapshot.verifiedItems), note: `de ${snapshot.totalEvidenceItems} registradas` },
    { label: "Evidencias pendientes", value: String(snapshot.pendingItems), note: "No suman al score" },
    { label: "Eventos cronologicos", value: String(snapshot.timelineEvents), note: "Hitos 2019-2026" },
    { label: "Anios de trayectoria", value: `${snapshot.timelineSpanYears}+`, note: "Desde 2019" },
  ];

  return (
    <main className="min-h-screen bg-[#030305] text-white px-6 py-14 md:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Numeros</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Indicadores verificables</h1>
          <p className="mt-3 text-sm text-white/75 md:text-base">
            Este bloque solo muestra metricas derivadas de evidencia real registrada en el sistema de confianza.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-white/70">{card.note}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
