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
  AlertCircle,
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
  BarChart3,
  Users,
  CreditCard,
  BookOpen,
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
    color: "text-white",
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
    color: "text-[#D4AF37]",
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
    name: "Resultados",
    icon: BarChart3,
    href: "/servicios/resultados",
    badge: "Transparencia",
    shortText: "Mira el rendimiento general.",
    buttonText: "Ver resultados",
    price: null,
  },
  {
    name: "Bot CARVIPIX",
    icon: Bot,
    href: "/servicios/bot",
    badge: "Premium",
    shortText: "Automatización para MT4/MT5.",
    buttonText: "Comprar bot",
    price: "Pago único 999 USD",
  },
  {
    name: "Gestión de Capital",
    icon: TrendingUp,
    href: "/servicios/capital",
    badge: "Privado",
    shortText: "Seguimiento de capital asignado.",
    buttonText: "Solicitar acceso",
    price: null,
  },
  {
    name: "Cuenta Fondeada",
    icon: CreditCard,
    href: "/servicios/fondeo",
    badge: "Alto capital",
    shortText: "Objetivo hasta 200K.",
    buttonText: "Solicitar revisión",
    price: "Servicio 5,000 USD",
  },
  {
    name: "Academia",
    icon: BookOpen,
    href: "/servicios/academia",
    badge: "Próximamente",
    shortText: "Formación CARVIPIX.",
    buttonText: "Notificarme",
    price: null,
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16 space-y-8"
            >
              {/* Badge superior */}
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37] font-semibold">
                  Sistema de Trading Automatizado
                </p>
              </div>

              {/* Título principal con propuesta de valor */}
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.15]">
                  Precisión en Cada
                  <span className="block text-[#D4AF37]">Movimiento</span>
                </h1>
              </div>

              {/* Descripción específica */}
              <p className="text-base text-white/70 max-w-2xl leading-relaxed">
                Sistema profesional de análisis de mercado con detección automática 
                de giros significativos. Diseñado para traders que buscan decisiones 
                basadas en estructura de mercado, no en intuición.
              </p>

              {/* Stats de autoridad */}
              <div className="grid grid-cols-3 gap-6 pt-4 sm:gap-8">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">Profesional</p>
                  <p className="text-xs text-white/60 mt-2">Análisis estructurado</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-[#D4AF37]">Confiable</p>
                  <p className="text-xs text-white/60 mt-2">Backtesting real</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">Exclusivo</p>
                  <p className="text-xs text-white/60 mt-2">Acceso limitado</p>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#10141D]/90 p-8 shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-lg hover:shadow-[#D4AF37]/25"
                  >
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/25" />

                    <div className="relative flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {stat.title}
                      </p>
                      <Icon size={28} className="text-[#D4AF37]" />
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
                      <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
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

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="rounded-2xl border border-[#D4AF37]/20 bg-[#10141D]/90 p-8 shadow-lg shadow-black/15"
              >
                {/* Disclaimer */}
                <div className="rounded-lg border-l-4 border-[#D4AF37] bg-[#D4AF37]/5 p-4 mb-6 flex gap-3 items-start">
                  <AlertCircle size={20} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Datos de demostración</p>
                    <p className="text-xs text-white/70 mt-1">
                      Este balance es simulado para propósitos educativos. 
                      Los resultados históricos no garantizan rendimiento futuro.
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Balance Demo</p>
                    <h2 className="text-2xl font-semibold text-white mt-2">Evolución de Balance</h2>
                  </div>
                  <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0B1220]/85 px-4 py-3 text-sm text-zinc-300">
                    <p className="font-semibold text-[#D4AF37]">+18.4% este mes</p>
                    <p className="mt-1 text-xs">Rendimiento demo</p>
                  </div>
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
                transition={{ duration: 0.55, delay: 0.1 }}
                className="rounded-2xl border border-[#D4AF37]/20 bg-[#10141D]/90 p-8 shadow-lg shadow-black/15"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Alertas Activas</h2>
                    <p className="mt-2 text-sm text-zinc-500">Señales de demostración</p>
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
                    Demo
                  </span>
                </div>

                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const AlertIcon = alert.type === "Compra" ? CheckCircle : ChevronRight;

                    return (
                      <div
                        key={alert.asset}
                        className="group rounded-xl border border-white/5 bg-[#0B1220]/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/15"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{alert.asset}</p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-white">
                              <AlertIcon size={16} className="text-[#D4AF37]" />
                              {alert.type}
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.color}`}>{alert.status}</span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-[#111827]/95 p-3 text-sm text-zinc-300">
                            <p className="text-[0.69rem] uppercase tracking-[0.25em] text-zinc-500">Entrada</p>
                            <p className="mt-2 text-white">{alert.entry}</p>
                          </div>
                          <div className="rounded-lg bg-[#111827]/95 p-3 text-sm text-zinc-300">
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
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 px-6 py-4 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/80 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                >
                  Ver todas las alertas
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </div>

            <div className="mt-8">
              <TradingViewEconomicCalendar />
            </div>

            <div className="mt-12 mb-8">
              <h2 className="text-3xl font-bold mb-3">Herramientas Profesionales</h2>
              <p className="text-white/60 text-sm">Acceso inmediato a soluciones premium.</p>
            </div>

            <div className="grid gap-6 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {quickAccess.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#0B111A] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:shadow-lg hover:shadow-[#D4AF37]/25 cursor-pointer"
                  >
                    {/* Glow effect */}
                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#D4AF37]/0 blur-3xl transition-all duration-300 group-hover:bg-[#D4AF37]/30" />
                    
                    {/* Badge */}
                    <div className="relative flex items-center justify-between mb-4">
                      <Icon className="w-8 h-8 text-[#D4AF37]" />
                      <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-lg border border-[#D4AF37]/30">
                        {item.badge}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="relative text-lg font-bold text-white mb-2">{item.name}</h3>
                    
                    {/* Description */}
                    <p className="relative text-sm text-white/70 mb-4 leading-relaxed">{item.shortText}</p>
                    
                    {/* Price if exists */}
                    {item.price && (
                      <p className="relative text-xs text-[#D4AF37] font-semibold mb-4">{item.price}</p>
                    )}
                    
                    {/* Spacer */}
                    <div className="relative flex-1" />
                    
                    {/* Button */}
                    <button className="relative w-full bg-[#D4AF37] text-[#05070B] font-bold py-3.5 px-4 rounded-lg hover:bg-[#E5C158] hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D4AF37]/40 active:scale-95 transition-all 200ms cubic-bezier(0.34, 1.56, 0.64, 1) text-sm">
                      {item.buttonText}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
    </main>
  );
}