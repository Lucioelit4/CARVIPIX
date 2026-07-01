"use client";

import { useEffect, useRef } from "react";

export default function TradingViewCalendar() {
  const calendarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!calendarRef.current) {
      return;
    }

    calendarRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(
      {
        colorTheme: "dark",
        dateRange: "12M",
        showChart: true,
        locale: "es",
        importanceFilter: ["-1", "0", "1"],
        currencyFilter: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF", "CNY"],
        width: "100%",
        height: "560",
      },
      null,
      2
    );

    calendarRef.current.appendChild(script);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-5 shadow-xl shadow-[#D4AF37]/10">
      <h2 className="mb-4 text-xl font-bold text-[#D4AF37]">Calendario económico</h2>
      <div ref={calendarRef} className="min-h-[560px] w-full" />
    </div>
  );
}
