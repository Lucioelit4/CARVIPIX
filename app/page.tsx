"use client";

import Link from "next/link";
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
  ArrowRight,
  Bell,
  Bot,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Signal,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import TradingViewEconomicCalendar from "./components/TradingViewEconomicCalendar";

const stats = [
  {
    title: "Balance",
    value: 8742.5,
    prefix: "$",
    suffix: " USD",
    note: "Equity actual",
    trend: "+3.2%",
    color: "text-[#D4AF37]",
    icon: Wallet,
  },
  {
    title: "Win Rate",
    value: 69.5,
    suffix: "%",
    note: "89 operaciones ganadoras",
    trend: "+1.8%",
    color: "text-green-400",
    icon: Target,
  },
  {
    title: "Operaciones del día",
    value: 7,
    note: "5 ganadas / 2 pérdidas",
    trend: "+2.5%",
    color: "text-white",
    icon: Activity,
  },
  {
    title: "Riesgo/Beneficio",
    value: 1.87,
    note: "Promedio operativo",
    trend: "+0.6",
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
  {
    name: "Alertas en Vivo",
    icon: Zap,
    href: "/servicios/alertas",
    title: "Miembro activo",
    subtitle: "Ya tienes acceso a señales y seguimiento operativo.",
    cta: "Ir a mis alertas",
  },
  {
    name: "Resultados generales",
    icon: LineChart,
    href: "/servicios/resultados",
    title: "Resultados generales",
    subtitle: "Rendimiento global y Top 10 de miembros destacados.",
    cta: "Ver resultados completos",
  },
  {
    name: "Análisis Diario",
    icon: Signal,
    href: "/servicios/analisis",
    title: "Miembro activo",
    subtitle: "Historial de análisis, escenarios del día y registros destacados.",
    cta: "Ver análisis del día",
  },
  {
    name: "Comunidad privada",
    icon: Wallet,
    href: "/servicios/comunidad",
    title: "Comunidad privada",
    subtitle: "Chat interno estilo Telegram para seguimiento y preguntas.",
    cta: "Entrar a comunidad",
  },
  {
    name: "Bot CARVIPIX",
    icon: Bot,
    href: "/servicios/bot",
    title: "Producto premium",
    subtitle: "Bot para MT4/MT5 con pago único.",
    cta: "Comprar Bot CARVIPIX",
  },
  {
    name: "Gestión de Capital",
    icon: TrendingUp,
    href: "/servicios/capital",
    title: "Invertir ahora",
    subtitle: "Gestión manual de capital desde 1,000 hasta 1,000,000 USD.",
    cta: "Solicitar inversión",
  },
  {
    name: "Cuenta fondeada",
    icon: Target,
    href: "/servicios/fondeo",
    title: "Cuenta fondeada",
    subtitle: "Servicio para pasar pruebas de fondeo y acceder a capital.",
    cta: "Solicitar cuenta fondeada",
  },
  {
    name: "Próximamente",
    icon: GraduationCap,
    href: "/servicios/academia",
    title: "Próximamente",
    subtitle: "Formación CARVIPIX en desarrollo.",
    cta: "Notificarme",
  },
];


export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_65%_12%,rgba(212,175,55,0.18),transparent_30%),radial-gradient(circle_at_20%_90%,rgba(212,175,55,0.08),transparent_25%)]" />

        <section>
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

                    <div className="relative mt-4 flex items-end justify-between gap-4">
                      <p className={`relative text-3xl font-bold ${stat.color}`}>
                        <CountUp
                          end={stat.value}
                          decimals={stat.value % 1 !== 0 ? 2 : 0}
                          duration={1.5}
                          prefix={stat.prefix || ""}
                          suffix={stat.suffix || ""}
                        />
                      </p>
                      <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                        {stat.trend}
                      </span>
                    </div>

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
                transition={{ duration: 0.55 }}
                className="rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30"
              >
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Balance</p>
                    <h2 className="text-2xl font-semibold text-white">Evolución de Balance</h2>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-[#0B1220]/85 px-4 py-3 text-sm text-zinc-300">
                    <p className="font-semibold text-[#D4AF37]">+18.4% este mes</p>
                    <p className="mt-1">Rendimiento demo con gestión conservadora.</p>
                  </div>
                </div>

                <div className="h-80 rounded-[1.75rem] border border-white/5 bg-black/25 p-4">
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
                transition={{ duration: 0.55, delay: 0.1 }}
                className="rounded-[2rem] border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Alertas activas</h2>
                    <p className="mt-2 text-sm text-zinc-500">Señales premium en tiempo real</p>
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
                    Activo
                  </span>
                </div>

                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const AlertIcon = alert.type === "Compra" ? CheckCircle : ChevronRight;

                    return (
                      <div
                        key={alert.asset}
                        className="group rounded-3xl border border-white/5 bg-[#0B1220]/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-[#D4AF37]/10"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{alert.asset}</p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-white">
                              <AlertIcon size={14} className="text-[#D4AF37]" />
                              {alert.type}
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.color}`}>{alert.status}</span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#111827]/95 p-3 text-sm text-zinc-300">
                            <p className="text-[0.69rem] uppercase tracking-[0.25em] text-zinc-500">Entrada</p>
                            <p className="mt-2 text-white">{alert.entry}</p>
                          </div>
                          <div className="rounded-2xl bg-[#111827]/95 p-3 text-sm text-zinc-300">
                            <p className="text-[0.69rem] uppercase tracking-[0.25em] text-zinc-500">TP / SL</p>
                            <p className="mt-2 text-white">{alert.tp} / {alert.sl}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/alertas"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 px-4 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
                >
                  Ver alertas
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>

            <div className="mt-8">
              <TradingViewEconomicCalendar />
            </div>

            <h2 className="mt-8 text-2xl font-bold">Soluciones CARVIPIX</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/25" />
                    <Icon className="relative mb-4 text-[#D4AF37]" />
                    <p className="relative text-lg font-bold">{item.title}</p>
                    <p className="relative mt-2 text-sm text-zinc-400">{item.subtitle}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                        {item.name}
                      </span>
                      <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                        {item.cta}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
    </main>
  );
}