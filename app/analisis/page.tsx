"use client";

import { useEffect, useState } from "react";
import { getGlobalResults, type GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";
import { CommunityAnalysisFeed } from "./CommunityAnalysisFeed";

export default function AnalisisPage() {
  const [globalResults, setGlobalResults] = useState<GlobalResultsSnapshot | null>(null);

  useEffect(() => {
    void getGlobalResults().then(setGlobalResults).catch(() => setGlobalResults(null));
  }, []);

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Inteligencia de mercado</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Analisis publicados</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/65 sm:text-base">
            Publicaciones reales del flujo editorial CARVIPIX. El contexto informativo se mantiene separado de las Alertas Oficiales.
          </p>
        </header>

        <div className="pt-8">
          <CommunityAnalysisFeed />
        </div>

        {globalResults?.enabled && globalResults.simulation ? (
          <section className="border-t border-white/10 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Resultados probabilísticos históricos</p>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Los escenarios probabilísticos se publican en Resultados y permanecen separados de estos análisis editoriales reales.
            </p>
          </section>
        ) : null}

        <footer className="border-t border-white/10 py-8 text-xs text-white/45">
          Solo se muestran publicaciones registradas por el servicio de inteligencia comunitaria. No se generan historiales de ejemplo.
        </footer>
      </div>
    </main>
  );
}