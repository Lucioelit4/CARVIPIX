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
import {
  CARVIPIXButton,
  CARVIPIXCard,
  CARVIPIXStatCard,
  colors,
  spacing,
  typography,
  shadows,
  borders,
} from "./design-system";

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
    <main style={{ backgroundColor: colors.black.dark, color: colors.white.pure, minHeight: '100vh' }}>
      {/* Background gradient */}
      <div style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(circle at 65% 12%, rgba(212, 175, 55, 0.18), transparent 30%), radial-gradient(circle at 20% 90%, rgba(212, 175, 55, 0.08), transparent 25%)`,
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        height: '80px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        backgroundColor: `rgba(7, 10, 15, 0.8)`,
        backdropFilter: 'blur(12px)',
        padding: spacing[32],
      }}>
        <div style={{ display: 'flex', gap: spacing[24], fontSize: typography.sizes.base }}>
          <p style={{ color: colors.white.secondary }}>
            Servidor:{" "}
            <span style={{ fontWeight: 600, color: colors.white.pure }}>14:36:22</span>
            <span style={{
              marginLeft: spacing[8],
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              boxShadow: '0 0 12px rgba(34, 197, 94, 0.9)',
            }} />
          </p>
          <p style={{ color: colors.white.secondary, display: 'none' }} className="xl:block">
            XAUUSD <span style={{ color: '#22C55E' }}>+0.42%</span>
          </p>
          <p style={{ color: colors.white.secondary, display: 'none' }} className="xl:block">
            BTCUSD <span style={{ color: '#22C55E' }}>+3.12%</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: spacing[16], alignItems: 'center' }}>
          <button style={{
            position: 'relative',
            borderRadius: '50%',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: `${spacing[8]} ${spacing[16]}`,
            fontSize: typography.sizes.base,
          }}>
            <Bell size={18} style={{ color: colors.gold.primary }} />
            <span style={{
              position: 'absolute',
              right: '-4px',
              top: '-4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.gold.primary,
            }} />
          </button>

          <div style={{
            borderRadius: '9999px',
            backgroundColor: `rgba(212, 175, 55, 0.1)`,
            padding: `${spacing[8]} ${spacing[16]}`,
            fontSize: typography.sizes.base,
            color: colors.gold.primary,
          }}>
            Miembro PRO
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700 }}>Abraham B.</p>
            <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary }}>Mi cuenta</p>
          </div>
        </div>
      </header>

      <div style={{ padding: spacing[32] }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: spacing[64], display: 'flex', flexDirection: 'column', gap: spacing[32] }}
        >
          {/* Badge */}
          <div>
            <p style={{
              fontSize: typography.sizes.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              color: colors.gold.primary,
              fontWeight: typography.weights.semibold,
            }}>
              Sistema de Trading Automatizado
            </p>
          </div>

          {/* Title */}
          <div>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              color: colors.white.pure,
              lineHeight: 1.15,
              margin: 0,
            }}>
              Precisión en Cada
              <span style={{ display: 'block', color: colors.gold.primary }}>Movimiento</span>
            </h1>
          </div>

          {/* Description */}
          <p style={{
            fontSize: typography.sizes.base,
            color: `rgba(255, 255, 255, 0.7)`,
            maxWidth: '600px',
            lineHeight: 1.6,
          }}>
            Sistema profesional de análisis de mercado con detección automática 
            de giros significativos. Diseñado para traders que buscan decisiones 
            basadas en estructura de mercado, no en intuición.
          </p>

          {/* Authority Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing[32],
            paddingTop: spacing[16],
          }}>
            <div>
              <p style={{ fontSize: '2.25rem', fontWeight: 700, color: colors.white.pure, margin: 0 }}>Profesional</p>
              <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary, marginTop: spacing[8] }}>Análisis estructurado</p>
            </div>
            <div>
              <p style={{ fontSize: '2.25rem', fontWeight: 700, color: colors.gold.primary, margin: 0 }}>Confiable</p>
              <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary, marginTop: spacing[8] }}>Backtesting real</p>
            </div>
            <div>
              <p style={{ fontSize: '2.25rem', fontWeight: 700, color: colors.white.pure, margin: 0 }}>Exclusivo</p>
              <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary, marginTop: spacing[8] }}>Acceso limitado</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: spacing[24],
          marginBottom: spacing[32],
        }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const color = stat.color === "text-[#D4AF37]" ? "gold" : "white";
            const displayColor = color === "gold" ? colors.gold.primary : colors.white.pure;
            
            return (
              <CARVIPIXStatCard
                key={stat.title}
                label={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                description={stat.note}
                trend={stat.trend}
                icon={Icon}
                color={color as 'gold' | 'white'}
              />
            );
          })}
        </div>

        {/* Charts & Alerts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[24], marginBottom: spacing[32] }}>
          {/* Balance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <CARVIPIXCard variant="elevated" padding="32">
              {/* Disclaimer */}
              <div style={{
                borderLeft: `4px solid ${colors.gold.primary}`,
                backgroundColor: `rgba(212, 175, 55, 0.05)`,
                padding: spacing[16],
                marginBottom: spacing[24],
                display: 'flex',
                gap: spacing[12],
                alignItems: 'flex-start',
                borderRadius: borders.radius.lg,
              }}>
                <AlertCircle size={20} style={{ color: colors.gold.primary, marginTop: spacing[4], flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.white.pure, margin: 0 }}>Datos de demostración</p>
                  <p style={{ fontSize: typography.sizes.xs, color: `rgba(255, 255, 255, 0.7)`, marginTop: spacing[8], margin: 0 }}>
                    Este balance es simulado para propósitos educativos. Los resultados históricos no garantizan rendimiento futuro.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: spacing[24], display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
                <div>
                  <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', color: colors.white.secondary, margin: 0 }}>Balance Demo</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.white.pure, marginTop: spacing[8], margin: 0 }}>Evolución de Balance</h2>
                </div>
                <div style={{
                  borderRadius: borders.radius.lg,
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  backgroundColor: `rgba(11, 18, 32, 0.85)`,
                  padding: `${spacing[12]} ${spacing[16]}`,
                  fontSize: typography.sizes.base,
                  color: colors.white.secondary,
                }}>
                  <p style={{ fontWeight: 600, color: colors.gold.primary, margin: 0 }}>+18.4% este mes</p>
                  <p style={{ marginTop: spacing[8], fontSize: typography.sizes.xs, margin: 0 }}>Rendimiento demo</p>
                </div>
              </div>

              <div style={{
                height: '320px',
                borderRadius: borders.radius.lg,
                border: `1px solid rgba(255, 255, 255, 0.05)`,
                backgroundColor: `rgba(0, 0, 0, 0.25)`,
                padding: spacing[16],
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceData}>
                    <defs>
                      <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.gold.primary} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={colors.gold.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke={colors.white.secondary} />
                    <YAxis stroke={colors.white.secondary} />
                    <Tooltip
                      contentStyle={{
                        background: colors.black.dark,
                        border: `1px solid rgba(212, 175, 55, 0.35)`,
                        borderRadius: borders.radius.lg,
                        color: colors.white.pure,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke={colors.gold.primary}
                      strokeWidth={4}
                      fill="url(#gold)"
                      dot={false}
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CARVIPIXCard>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <CARVIPIXCard variant="elevated" padding="32">
              <div style={{ marginBottom: spacing[24], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: colors.white.pure, margin: 0 }}>Alertas Activas</h2>
                  <p style={{ marginTop: spacing[8], fontSize: typography.sizes.base, color: colors.white.secondary, margin: 0 }}>Señales de demostración</p>
                </div>
                <span style={{
                  borderRadius: '9999px',
                  border: `1px solid rgba(212, 175, 55, 0.2)`,
                  backgroundColor: `rgba(212, 175, 55, 0.1)`,
                  padding: `${spacing[8]} ${spacing[12]}`,
                  fontSize: typography.sizes.xs,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.24em',
                  color: colors.gold.primary,
                }}>
                  Demo
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
                {alerts.map((alert) => {
                  const AlertIcon = alert.type === "Compra" ? CheckCircle : ChevronRight;

                  return (
                    <div
                      key={alert.asset}
                      style={{
                        borderRadius: borders.radius.lg,
                        border: `1px solid rgba(255, 255, 255, 0.05)`,
                        backgroundColor: `rgba(11, 18, 32, 0.8)`,
                        padding: spacing[16],
                        transition: 'all 300ms',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing[16], marginBottom: spacing[16] }}>
                        <div>
                          <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary, margin: 0 }}>{alert.asset}</p>
                          <div style={{ marginTop: spacing[8], display: 'flex', alignItems: 'center', gap: spacing[8], fontSize: typography.sizes.base, color: colors.white.pure }}>
                            <AlertIcon size={16} style={{ color: colors.gold.primary }} />
                            {alert.type}
                          </div>
                        </div>
                        <span style={{
                          borderRadius: '9999px',
                          padding: `${spacing[8]} ${spacing[12]}`,
                          fontSize: typography.sizes.xs,
                          fontWeight: 600,
                          color: alert.color === 'text-green-400' ? '#22C55E' : colors.gold.primary,
                        }}>
                          {alert.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[12] }}>
                        <div style={{
                          borderRadius: borders.radius.md,
                          backgroundColor: `rgba(17, 24, 39, 0.95)`,
                          padding: spacing[12],
                          fontSize: typography.sizes.base,
                          color: colors.white.secondary,
                        }}>
                          <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.25em', color: colors.white.secondary, margin: 0 }}>Entrada</p>
                          <p style={{ marginTop: spacing[8], color: colors.white.pure, fontWeight: 500, margin: 0 }}>{alert.entry}</p>
                        </div>
                        <div style={{
                          borderRadius: borders.radius.md,
                          backgroundColor: `rgba(17, 24, 39, 0.95)`,
                          padding: spacing[12],
                          fontSize: typography.sizes.base,
                          color: colors.white.secondary,
                        }}>
                          <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.25em', color: colors.white.secondary, margin: 0 }}>TP / SL</p>
                          <p style={{ marginTop: spacing[8], color: colors.white.pure, fontWeight: 500, margin: 0 }}>{alert.tp} / {alert.sl}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/alertas">
                <CARVIPIXButton 
                  variant="secondary"
                  size="lg"
                  fullWidth
                  rightIcon={<ArrowRight size={18} />}
                  style={{ marginTop: spacing[32] }}
                >
                  Ver todas las alertas
                </CARVIPIXButton>
              </Link>
            </CARVIPIXCard>
          </motion.div>
        </div>

        {/* Economic Calendar */}
        <div style={{ marginBottom: spacing[32] }}>
          <TradingViewEconomicCalendar />
        </div>

        {/* Professional Tools Section */}
        <div style={{ marginBottom: spacing[32] }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: spacing[12], margin: 0, color: colors.white.pure }}>Herramientas Profesionales</h2>
          <p style={{ color: `rgba(255, 255, 255, 0.6)`, fontSize: typography.sizes.xs, margin: 0 }}>Acceso inmediato a soluciones premium.</p>
        </div>

        {/* Quick Access Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: spacing[24],
        }}>
          {quickAccess.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <CARVIPIXCard variant="default" padding="24" hover>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[16] }}>
                    <Icon size={32} style={{ color: colors.gold.primary }} />
                    <span style={{
                      fontSize: typography.sizes.xs,
                      fontWeight: 700,
                      color: colors.gold.primary,
                      backgroundColor: `rgba(212, 175, 55, 0.1)`,
                      padding: `${spacing[8]} ${spacing[12]}`,
                      borderRadius: borders.radius.md,
                      border: `1px solid rgba(212, 175, 55, 0.3)`,
                    }}>
                      {item.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: colors.white.pure, marginBottom: spacing[8], margin: 0 }}>
                    {item.name}
                  </h3>

                  <p style={{ fontSize: typography.sizes.base, color: `rgba(255, 255, 255, 0.7)`, marginBottom: spacing[16], lineHeight: 1.6, margin: 0 }}>
                    {item.shortText}
                  </p>

                  {item.price && (
                    <p style={{ fontSize: typography.sizes.xs, color: colors.gold.primary, fontWeight: 600, marginBottom: spacing[16], margin: 0 }}>
                      {item.price}
                    </p>
                  )}

                  <CARVIPIXButton
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    {item.buttonText}
                  </CARVIPIXButton>
                </CARVIPIXCard>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}