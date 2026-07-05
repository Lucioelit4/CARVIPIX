"use client";

import { useEffect, useRef, useState } from "react";

const MAJOR_CURRENCIES = "USD,EUR,GBP,JPY,CAD,AUD,NZD,CHF";

export default function TradingViewEconomicCalendar() {
  const compactRef = useRef<HTMLDivElement | null>(null);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const [hasErrorCompact, setHasErrorCompact] = useState(false);
  const [hasErrorExpanded, setHasErrorExpanded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedInitialized, setExpandedInitialized] = useState(false);

  useEffect(() => {
    if (!compactRef.current) {
      return;
    }

    compactRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container__widget";
    compactRef.current.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.addEventListener("error", () => setHasErrorCompact(true));
    script.innerHTML = JSON.stringify(
      {
        colorTheme: "dark",
        isTransparent: true,
        width: "100%",
        height: "420",
        locale: "es",
        importanceFilter: "2",
        currencyFilter: MAJOR_CURRENCIES,
      },
      null,
      2
    );

    compactRef.current.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isExpanded || !expandedRef.current || expandedInitialized) {
      return;
    }

    expandedRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container__widget";
    expandedRef.current.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.addEventListener("error", () => setHasErrorExpanded(true));
    script.innerHTML = JSON.stringify(
      {
        colorTheme: "dark",
        isTransparent: true,
        width: "100%",
        height: "760",
        locale: "es",
        importanceFilter: "-1,0,1,2",
        currencyFilter: MAJOR_CURRENCIES,
      },
      null,
      2
    );

    expandedRef.current.appendChild(script);
    setExpandedInitialized(true);
  }, [isExpanded, expandedInitialized]);

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#121212]/90 p-5 shadow-xl shadow-[#D4AF37]/10 overflow-visible">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.18em] text-[#D4AF37]/80">
              Eventos relevantes de hoy
            </p>
            <h2 className="text-2xl font-bold text-white">Calendario económico</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Solo eventos de alto impacto (USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF) para el día de hoy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#1B1F2A]/95 px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            Ver calendario completo
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0B1220]/80 p-3">
          {hasErrorCompact ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0B0B0B]/80 p-6 text-center text-sm text-slate-300">
              No se pudo cargar los eventos relevantes.
              <br />
              Intenta recargar la página o abrir el calendario completo.
            </div>
          ) : (
            <div ref={compactRef} className="min-h-[420px] w-full" />
          )}
        </div>
      </div>

      {isExpanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0B1220]/95 shadow-2xl shadow-black/50">
            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-sm uppercase tracking-[0.18em] text-[#D4AF37]/80">
                  Vista completa
                </p>
                <h3 className="text-xl font-bold text-white">Calendario económico completo</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Todos los niveles de impacto para las principales divisas, en una vista expandida.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-[28px] border border-white/10 bg-[#121212]/90 p-4">
                {hasErrorExpanded ? (
                  <div className="flex min-h-[760px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-[#0B0B0B]/80 p-6 text-center text-sm text-slate-300">
                    No se pudo cargar el calendario completo.
                    <br />
                    Prueba de nuevo en unos instantes.
                  </div>
                ) : (
                  <div ref={expandedRef} className="min-h-[760px] w-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
