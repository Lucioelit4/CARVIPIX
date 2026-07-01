"use client";

import { useEffect, useRef } from "react";

const TRADINGVIEW_SCRIPT_ID = "tradingview-widget-script";

function loadTradingViewScript() {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      return resolve();
    }

    const existingScript = document.getElementById(TRADINGVIEW_SCRIPT_ID);
    if (existingScript) {
      if ((window as any).TradingView) {
        return resolve();
      }

      existingScript.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = TRADINGVIEW_SCRIPT_ID;
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export default function TradingViewChart() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    loadTradingViewScript().then(() => {
      if (!mounted || !chartRef.current || !(window as any).TradingView) {
        return;
      }

      const TradingView = (window as any).TradingView;
      chartRef.current.innerHTML = "";

      new TradingView.widget({
        autosize: true,
        symbol: "OANDA:XAUUSD",
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "es",
        toolbar_bg: "#0b1220",
        enable_publishing: false,
        allow_symbol_change: true,
        container: chartRef.current,
        hide_top_toolbar: false,
        withdateranges: true,
        hide_side_toolbar: false,
        studies: ["RSI@tv-basicstudies"],
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1220]/90 p-2 shadow-inner shadow-black/20">
      <div ref={chartRef} className="h-[360px] w-full rounded-[18px] bg-[#090B10]" />
    </div>
  );
}
