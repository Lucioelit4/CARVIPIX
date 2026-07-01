"use client";

import Image from "next/image";
import CountUp from "react-countup";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  GraduationCap,
  LineChart,
  Newspaper,
  ShieldCheck,
  Signal,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  "Dashboard",
  "Alertas en Vivo",
  "Resultados",
  "Análisis Diario",
  "Comunidad",
  "Bot CARVIPIX",
  "Gestión de Capital",
  "Programa de Fondeo",
  "Herramientas",
  "Perfil",
  "Soporte",
];

const stats = [
  {
    title: "Balance",
    value: 8742.5,
    prefix: "$",
    suffix: " USD",
    note: "Equity actual",
    color: "text-[#D4AF37]",
    icon: Wallet,
  },
  {
    title: "Win Rate",
    value: 69.5,
    suffix: "%",
    note: "89 operaciones ganadoras",
    color: "text-green-400",
    icon: Target,
  },
  {
    title: "Operaciones del día",
    value: 7,
    note: "5 ganadas / 2 pérdidas",
    color: "text-white",
    icon: Activity,
  },
  {
    title: "Riesgo/Beneficio",
    value: 1.87,
    note: "Promedio operativo",
    color: "text-purple-400",
    icon: ShieldCheck,
  },
];

const balanceData = [
  { day: "01", balance: 2000 },
  { day: "03", balance: 2450 },
  { day: "05", balance: 2850 },
  { day: "07", balance: 3400 },
  { day: "09", balance: 4300 },
  { day: "11", balance: 4750 },
  { day: "13", balance: 5600 },
  { day: "15", balance: 6900 },
  { day: "17", balance: 7200 },
  { day: "19", balance: 8100 },
  { day: "21", balance: 8420 },
  { day: "23", balance: 8742 },
];

const alerts = [
  {
    asset: "XAUUSD",
    type: "Compra",
    entry: "2338.45",
    tp: "2345.00",
    sl: "2332.00",
    status: "Activa",
    color: "text-green-400",
  },
  {
    asset: "BTCUSD",
    type: "Compra",
    entry: "61520.00",
    tp: "62880.00",
    sl: "60780.00",
    status: "+3.12%",
    color: "text-green-400",
  },
  {
    asset: "EURUSD",
    type: "Venta",
    entry: "1.07153",
    tp: "1.06900",
    sl: "1.07320",
    status: "TP cerca",
    color: "text-[#D4AF37]",
  },
];

const quickAccess = [
  { name: "Alertas en Vivo", icon: Zap },
  { name: "Resultados", icon: LineChart },
  { name: "Análisis Diario", icon: ChartNoAxesCombined },
  { name: "Comunidad", icon: Signal },
  { name: "Bot CARVIPIX", icon: Bot },
  { name: "Gestión de Capital", icon: Wallet },
  { name: "Fondeo", icon: TrendingUp },
  { name: "Academia", icon: GraduationCap },
];

const news = [
  {
    title: "Oro mantiene presión alcista mientras el dólar pierde fuerza",
    tag: "XAUUSD",
    time: "Hace 12 min",
  },
  {
    title: "Bitcoin recupera zona clave y aumenta volumen institucional",
    tag: "BTCUSD",
    time: "Hace 24 min",
  },
  {
    title: "Mercado atento a datos de inflación y comentarios de la FED",
    tag: "USD",
    time: "Hace 41 min",
  },
];

const calendar = [
  {
    event: "PMI Manufacturero",
    currency: "USD",
    impact: "Alto",
    time: "08:30",
  },
  {
    event: "Inventarios de petróleo",
    currency: "USD",
    impact: "Medio",
    time: "10:00",
  },
  {
    event: "Discurso miembro FED",
    currency: "USD",
    impact: "Alto",
    time: "12:30",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_65%_12%,rgba(212,175,55,0.18),transparent_30%),radial-gradient(circle_at_20%_90%,rgba(212,175,55,0.08),transparent_25%)]" />

      <div className="relative flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#070A0F]/95 lg:flex lg:flex-col">
          <div className="flex h-full flex-col justify-between p-6">
            <div>
              <div className="mb-10 flex justify-center pt-4">
                <Image
                  src="/logo/logo carvipix.png"
                  alt="CARVIPIX"
                  width={220}
                  height={70}
                  priority
                  style={{ width: "220px", height: "auto" }}
                />
              </div>

              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <div
                    key={item}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl px-4 py-3 text-sm transition duration-300 ${
                      index === 0
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] font-bold text-black shadow-lg shadow-[#D4AF37]/25"
                        : "text-zinc-300 hover:bg-white/5 hover:text-[#D4AF37]"
                    }`}
                  >
                    {index !== 0 && (
                      <span className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-full bg-[#D4AF37] transition-all duration-300 group-hover:h-6" />
                    )}
                    <span className="relative z-10">{item}</span>
                  </div>
                ))}
              </nav>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#10141D]/90 p-5 shadow-2xl shadow-[#D4AF37]/10">
              <p className="text-sm text-zinc-400">Plan actual</p>
              <p className="mt-2 text-xl font-bold text-[#D4AF37]">
                CARVIPIX PRO
              </p>
              <button className="mt-5 w-full rounded-xl bg-[#D4AF37] py-3 font-bold text-black shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#F5D76E]">
                Ver planes
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 lg:ml-72">
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#070A0F]/80 px-8 backdrop-blur-xl">
            <div className="flex items-center gap-6 text-sm">
              <p className="text-zinc-400">
                Servidor:{" "}
                <span className="font-semibold text-white">14:36:22</span>
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              </p>

              <p className="hidden text-zinc-500 xl:block">
                XAUUSD <span className="text-green-400">+0.42%</span>
              </p>

              <p className="hidden text-zinc-500 xl:block">
                BTCUSD <span className="text-green-400">+3.12%</span>
              </p>
            </div>

            <div className="flex items-center gap-5">
              <button className="relative rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
                <Bell size={18} className="text-[#D4AF37]" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#D4AF37]" />
              </button>

              <div className="rounded-full bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
                Miembro PRO
              </div>

              <div className="text-right">
                <p className="font-bold">Abraham B.</p>
                <p className="text-xs text-zinc-500">Mi cuenta</p>
              </div>
            </div>
          </header>

          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center justify-between gap-6"
            >
              <div>
                <h1 className="text-4xl font-bold text-[#D4AF37]">
                  Bienvenido a CARVIPIX
                </h1>
                <p className="mt-2 text-zinc-400">
                  Tu ventaja en el mercado empieza aquí.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 shadow-2xl shadow-black/30">
                <p className="text-sm text-zinc-400">Renovación</p>
                <p className="font-bold">18/07/2026</p>
              </div>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[#D4AF37]/10"
                  >
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/20" />

                    <div className="relative flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {stat.title}
                      </p>
                      <Icon size={20} className="text-[#D4AF37]" />
                    </div>

                    <p className={`relative mt-4 text-3xl font-bold ${stat.color}`}>
                      <CountUp
                        end={stat.value}
                        decimals={stat.value % 1 !== 0 ? 2 : 0}
                        duration={1.5}
                        prefix={stat.prefix || ""}
                        suffix={stat.suffix || ""}
                      />
                    </p>

                    <p className="relative mt-2 text-sm text-zinc-500">
                      {stat.note}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Evolución de Balance</h2>
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">
                    Últimos 30 días
                  </button>
                </div>

                <div className="h-80 rounded-xl border border-white/5 bg-black/25 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceData}>
                      <defs>
                        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="#71717A" />
                      <YAxis stroke="#71717A" />
                      <Tooltip
                        contentStyle={{
                          background: "#05070B",
                          border: "1px solid rgba(212,175,55,0.35)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#D4AF37"
                        strokeWidth={4}
                        fill="url(#gold)"
                        dot={false}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30"
              >
                <h2 className="mb-6 text-xl font-bold">Alertas activas</h2>

                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.asset}
                      className="group rounded-xl border border-white/5 bg-black/25 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/10"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{alert.asset}</p>
                        <span className={`text-sm font-bold ${alert.color}`}>
                          {alert.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                        <p className="text-zinc-500">{alert.type}</p>
                        <p>
                          <span className="font-semibold text-white">Entrada:</span>
                          <br />
                          {alert.entry}
                        </p>
                        <p>
                          <span className="font-semibold text-white">TP:</span>
                          <br />
                          {alert.tp}
                        </p>
                        <p>
                          <span className="font-semibold text-white">SL:</span>
                          <br />
                          {alert.sl}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Newspaper className="text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold">Noticias del mercado</h2>
                </div>

                <div className="space-y-4">
                  {news.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-white/5 bg-black/25 p-4 transition hover:border-[#D4AF37]/30"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">
                          {item.tag}
                        </span>
                        <span className="text-xs text-zinc-500">{item.time}</span>
                      </div>
                      <p className="font-semibold">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <CalendarDays className="text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold">Calendario económico</h2>
                </div>

                <div className="space-y-4">
                  {calendar.map((item) => (
                    <div
                      key={item.event}
                      className="grid grid-cols-[80px_1fr_80px] items-center gap-4 rounded-xl border border-white/5 bg-black/25 p-4 transition hover:border-[#D4AF37]/30"
                    >
                      <p className="font-bold text-[#D4AF37]">{item.time}</p>
                      <div>
                        <p className="font-semibold">{item.event}</p>
                        <p className="text-sm text-zinc-500">{item.currency}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-center text-xs ${
                          item.impact === "Alto"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {item.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-bold">Accesos rápidos</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.name}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/25" />
                    <Icon className="relative mb-4 text-[#D4AF37]" />
                    <p className="relative text-lg font-bold">{item.name}</p>
                    <p className="relative mt-2 text-sm text-zinc-500">
                      Acceder ahora
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}