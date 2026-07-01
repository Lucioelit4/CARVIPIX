"use client";

import { useEffect, useRef } from "react";

export default function TradingViewNews() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-news.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify(
      {
        colorTheme: "dark",
        dateRange: "12M",
        showChart: true,
        locale: "es",
        isTransparent: true,
        width: "100%",
        height: "560",
      },
      null,
      2
    );

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-5 shadow-xl shadow-[#D4AF37]/10">
      <h2 className="mb-4 text-xl font-bold text-[#D4AF37]">Noticias del mercado</h2>
      <div ref={containerRef} className="min-h-[560px] w-full" />
    </div>
  );
}
