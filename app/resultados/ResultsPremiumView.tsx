"use client";

import { useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ShieldCheck, Target } from "lucide-react";

import type { GlobalResultsSnapshot } from "@/app/lib/client-data-helpers";

const PAGE_SIZE = 8;

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ResultsPremiumView({ results }: { results: GlobalResultsSnapshot | null }) {
  const [page, setPage] = useState(1);
  const activity = results?.activity ?? [];
  const closed = results?.alerts.total ?? 0;
  const wins = results?.alerts.takeProfits ?? 0;
  const losses = results?.alerts.stopLosses ?? 0;
  const winRate = results?.alerts.winRate ?? 0;
  const lossRate = closed > 0 ? (losses / closed) * 100 : 0;
  const totalPages = Math.max(1, Math.ceil(activity.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = activity.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="overflow-x-hidden bg-[#040506] text-white">
      <section className="relative isolate min-h-[680px] overflow-hidden border-b border-[#D4AF37]/15 bg-[#06080c] sm:min-h-[720px]">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_42%,rgba(21,56,99,0.34),transparent_27%),radial-gradient(circle_at_68%_22%,rgba(212,175,55,0.15),transparent_21%),linear-gradient(135deg,#050607_0%,#08101c_58%,#040506_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <MarketTexture />
        <div className="cv-workspace relative grid min-h-[680px] max-w-7xl items-center gap-12 py-16 sm:min-h-[720px] sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
          <div className="relative z-10">
            <div className="flex items-center gap-3"><span className="h-px w-10 bg-[#D4AF37]" /><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Resultados históricos CARVIPIX</p></div>
            <p
              className="mt-10 bg-[linear-gradient(180deg,#FFF7D0_0%,#D4AF37_52%,#8C6A16_100%)] bg-clip-text font-black text-transparent drop-shadow-[0_8px_32px_rgba(212,175,55,0.12)]"
              style={{ fontSize: "clamp(4.5rem, 10vw, 9.5rem)", lineHeight: 1 }}
            >
              {winRate.toFixed(2)}%
            </p>
            <h1 className="mt-6 text-2xl font-semibold uppercase tracking-[0.08em] text-white sm:text-4xl">Tasa de acierto histórica</h1>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-l border-[#D4AF37]/50 pl-5 text-sm sm:text-base">
              <strong className="text-xl text-white sm:text-2xl">{closed} operaciones cerradas</strong><span className="hidden h-5 w-px bg-white/15 sm:block" />
              <span><b className="text-emerald-300">{wins} ganadas</b><span className="mx-2 text-white/25">·</span><b className="text-rose-300">{losses} perdidas</b></span>
            </div>
            <p className="mt-5 text-sm font-semibold tracking-[0.12em] text-[#D4AF37]">RR 1:2 · 1:3 · 1:4</p>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-[450px] items-center justify-center lg:ml-auto">
            <div className="absolute inset-[7%] rounded-full border border-[#D4AF37]/10 shadow-[0_0_90px_rgba(18,55,96,0.38)]" />
            <div className="absolute inset-[15%] rounded-full bg-[conic-gradient(from_210deg,#8c6a16_0%,#f2d675_14%,#d4af37_62.5%,rgba(134,39,52,0.22)_62.5%,rgba(255,255,255,0.05)_100%)] p-[3px]">
              <div className="flex size-full items-center justify-center rounded-full bg-[radial-gradient(circle,#101827_0%,#070a10_65%,#050608_100%)] shadow-[inset_0_0_55px_rgba(212,175,55,0.08)]">
                <div className="text-center"><Activity className="mx-auto text-[#D4AF37]/70" size={24} /><p className="mt-4 text-5xl font-black text-white sm:text-6xl">{winRate.toFixed(1)}</p><p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">Índice histórico</p></div>
              </div>
            </div>
            <div className="absolute bottom-[8%] left-[5%] border-l border-[#D4AF37]/50 bg-black/45 px-4 py-3 backdrop-blur-md"><p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Control de riesgo</p><p className="mt-1 text-sm font-semibold text-[#D4AF37]">Objetivos hasta 4R</p></div>
          </div>
        </div>
      </section>

      <section className="relative cv-workspace max-w-7xl py-16 sm:py-24">
        <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Balance histórico</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Ganadas vs. perdidas</h2></div><Target className="text-[#D4AF37]" size={28} /></div>
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative mx-auto aspect-square w-full max-w-[330px] rounded-full bg-[conic-gradient(#57d6a2_0%_62.5%,rgba(190,67,81,0.48)_62.5%_100%)] p-[10px] shadow-[0_0_70px_rgba(18,55,96,0.25)]"><div className="flex size-full flex-col items-center justify-center rounded-full bg-[#07090d]"><p className="text-5xl font-black text-[#D4AF37]">{closed}</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">Operaciones cerradas</p></div></div>
          <div><div className="grid divide-y divide-white/10 border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0"><OutcomePanel type="win" count={wins} rate={winRate} /><OutcomePanel type="loss" count={losses} rate={lossRate} /></div>
            <div className="mt-10"><div className="relative flex h-2 overflow-hidden rounded-full bg-white/5"><div className="bg-[linear-gradient(90deg,#92701c,#D4AF37,#57d6a2)]" style={{ width: `${winRate}%` }} /><div className="bg-rose-400/35" style={{ width: `${lossRate}%` }} /></div><div className="mt-4 flex justify-between text-xs font-semibold uppercase tracking-[0.1em]"><span className="text-emerald-300">{winRate.toFixed(1)}% ganador</span><span className="text-rose-300">{lossRate.toFixed(1)}% perdedor</span></div></div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[#D4AF37]/10 bg-[#07101c]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_55%,rgba(28,74,127,0.28),transparent_30%)]" />
        <div className="cv-workspace relative max-w-7xl py-16 sm:py-24">
          <div className="flex items-center gap-3 text-[#D4AF37]"><ShieldCheck size={30} /><p className="text-xs font-semibold uppercase tracking-[0.2em]">Gestión de riesgo</p></div>
          <h2 className="mt-5 text-3xl font-black uppercase sm:text-5xl">La diferencia está en la gestión de riesgo</h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-[0.55fr_auto_1.45fr] lg:items-center">
            <div className="border border-white/10 bg-black/30 p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Riesgo</p><p className="mt-5 text-6xl font-black">1R</p><div className="mt-8 h-3 w-1/3 bg-[linear-gradient(90deg,#fff,#79879c)]" /><p className="mt-5 text-sm leading-6 text-white/50">Riesgo base controlado por operación.</p></div>
            <ArrowRight className="mx-auto rotate-90 text-[#D4AF37] lg:rotate-0" size={30} />
            <div className="space-y-3">{[2, 3, 4].map((target) => <div key={target} className="grid items-center gap-5 border-b border-white/10 bg-[linear-gradient(90deg,rgba(212,175,55,0.055),transparent)] px-5 py-5 sm:grid-cols-[190px_1fr]"><p className="text-lg font-bold text-[#D4AF37]">1:{target} → potencial {target}R</p><div className="flex gap-1.5">{Array.from({ length: target }, (_, index) => <span key={index} className="h-7 min-w-0 flex-1 border border-[#F2D675]/20 bg-[linear-gradient(180deg,#F2D675_0%,#D4AF37_45%,#765713_100%)]" />)}</div></div>)}</div>
          </div>
          <div className="mt-10 max-w-4xl border-l-2 border-[#D4AF37] pl-5"><p className="text-lg font-semibold leading-8">CARVIPIX combina una tasa histórica de acierto del {winRate.toFixed(2)}% con objetivos de beneficio superiores al riesgo asumido.</p><p className="mt-3 text-sm leading-6 text-white/55">Una operación ganadora puede compensar varias pérdidas controladas dependiendo de la relación riesgo/beneficio alcanzada.</p></div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-[linear-gradient(180deg,#07090c_0%,#040506_100%)]">
        <div className="cv-workspace relative max-w-7xl py-16 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Registro de operaciones</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Historial de resultados</h2></div><p className="max-w-sm text-sm leading-6 text-white/45">Detalle cronológico de resultados con relación riesgo/beneficio cuando está disponible.</p></div>
          <div className="mt-10 hidden overflow-x-auto border border-white/[0.08] bg-[#080b10]/65 md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#D4AF37]/15 text-[10px] uppercase tracking-[0.14em] text-white/45"><tr>{["Fecha", "Actividad", "Resumen", "Estado"].map((heading) => <th key={heading} className="px-6 py-5">{heading}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.065]">{visibleRows.map((row) => <tr key={row.activityId}><td className="whitespace-nowrap px-6 py-5 text-white/50">{dateLabel(row.occurredAt)}</td><td className="px-6 py-5 font-bold">{row.title}</td><td className="px-6 py-5 text-white/65">{row.summary}</td><td className="px-6 py-5 text-[#D4AF37]">{row.activityType}</td></tr>)}{visibleRows.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-white/45">Aún no hay actividad oficial disponible.</td></tr> : null}</tbody></table></div>
          <div className="mt-10 grid gap-3 md:hidden">{visibleRows.map((row) => <article key={row.activityId} className="border border-white/[0.08] bg-[#080b10]/80 p-5"><div className="flex justify-between gap-4"><div><p className="font-bold">{row.title}</p><p className="mt-1 text-xs text-white/45">{dateLabel(row.occurredAt)}</p></div><span className="text-xs text-[#D4AF37]">{row.activityType}</span></div><p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/65">{row.summary}</p></article>)}{visibleRows.length === 0 ? <p className="border border-white/10 p-8 text-center text-sm text-white/45">Aún no hay actividad oficial disponible.</p> : null}</div>
          <div className="mt-7 flex items-center justify-end gap-4"><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-10 place-items-center border border-white/10 disabled:opacity-25"><ChevronLeft size={18} /></button><span className="text-xs text-white/55">{currentPage} / {totalPages}</span><button type="button" aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-10 place-items-center border border-white/10 disabled:opacity-25"><ChevronRight size={18} /></button></div>
          <p className="mt-14 border-t border-[#D4AF37]/15 pt-8 text-center text-xs leading-5 text-white/35">Resultados históricos de CARVIPIX. El rendimiento pasado no garantiza resultados futuros. La relación riesgo/beneficio puede variar entre operaciones.</p>
        </div>
      </section>
    </div>
  );
}

function OutcomePanel({ type, count, rate }: { type: "win" | "loss"; count: number; rate: number }) {
  const win = type === "win";
  const Icon = win ? ArrowUpRight : ArrowDownRight;
  return <article className="px-4 py-7 sm:px-8 sm:py-9"><div className="flex items-start justify-between gap-4"><div><p className="text-5xl font-black sm:text-6xl">{count}</p><h3 className="mt-3 text-sm font-semibold uppercase text-white/65">Operaciones {win ? "ganadoras" : "perdedoras"}</h3></div><Icon className={win ? "text-emerald-300" : "text-rose-300"} size={28} /></div><p className={`mt-8 text-3xl font-black ${win ? "text-emerald-300" : "text-rose-300"}`}>{rate.toFixed(2)}%</p></article>;
}

function MarketTexture() {
  const candles = [42, 68, 51, 82, 64, 95, 76, 112, 91, 126, 104, 138];
  return <div className="pointer-events-none absolute bottom-16 right-[3%] -z-10 hidden h-52 w-[48%] items-end gap-3 opacity-20 lg:flex" aria-hidden="true">{candles.map((height, index) => <span key={index} className="relative flex-1" style={{ height }}><span className={`absolute left-1/2 top-[-12px] h-[calc(100%+24px)] w-px ${index % 3 === 0 ? "bg-emerald-300" : "bg-[#D4AF37]"}`} /><span className={`absolute inset-x-[22%] bottom-0 h-[68%] ${index % 3 === 0 ? "bg-emerald-300" : "bg-[#D4AF37]"}`} /></span>)}</div>;
}