import type { Metadata } from "next";
import { Bot, TrendingUp, Users, Wallet, ShieldCheck, BarChart3, Zap, Star, CheckCircle2, ArrowRight } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";
import { listActiveVideos } from "@/app/backend/compliance/compliance-service";

const SITE_URL = "https://carvipix.com";

export const metadata: Metadata = {
  title: "CARVIPIX — Plataforma Profesional de Trading",
  description:
    "CARVIPIX es una plataforma tecnologica para traders con Bot EA MT5, alertas en vivo, herramientas operativas, resultados y comunidad.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "CARVIPIX — Plataforma Profesional de Trading",
    description: "Bot EA MT5, alertas en vivo, herramientas operativas, resultados y comunidad de traders.",
    url: SITE_URL,
    type: "website",
  },
};

export default async function Home() {
  const activeVideos = await listActiveVideos();
  const publicVideo = activeVideos.find((item) => item.scope === "public-home");

  return (
    <main className="min-h-screen bg-[#05070b] text-[#f5f1e8]">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section aria-label="Presentación" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%),linear-gradient(180deg,#121620_0%,#090c12_100%)] p-8 sm:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d4af37]">Plataforma de Trading Profesional</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Opera con estructura.<br className="hidden sm:block" /> Decide con claridad.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[#c7c0b4] sm:text-lg">
            CARVIPIX integra Bot EA MT5, alertas en vivo, herramientas operativas y comunidad en un solo ecosistema tecnologico.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg">
              Crear cuenta gratuita
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/servicios" variant="secondary" size="lg">
              Ver planes y precios
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/trust-center" variant="secondary" size="lg">
              Ver Trust Center
            </CARVIPIXButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-xs text-[#c7c0b4]">
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#d4af37]" />Sin compromisos</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#d4af37]" />Acceso inmediato</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#d4af37]" />Soporte incluido</span>
          </div>
        </div>
      </section>


      {/* ── VIDEO INSTITUCIONAL ─────────────────────────────────────────────── */}
      {publicVideo && (
        <section aria-label="Video institucional" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-14">
          <div className="rounded-2xl border border-white/10 bg-[#0d1119] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4af37]">Video institucional</p>
            <h2 className="mt-3 text-2xl font-semibold">{publicVideo.title}</h2>
            <p className="mt-2 text-sm text-[#c7c0b4]">{publicVideo.description}</p>
            <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <video className="h-full w-full" controls preload="metadata" poster={publicVideo.posterUrl} src={publicVideo.videoUrl}>
                Tu navegador no soporta video HTML5.
              </video>
            </div>
          </div>
        </section>
      )}

      {/* ── QUÉ ES CARVIPIX ─────────────────────────────────────────────────── */}
      <section aria-label="Qué es CARVIPIX" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d4af37]">Qué es CARVIPIX</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Un ecosistema completo para el trader profesional</h2>
          <p className="mt-4 mx-auto max-w-2xl text-[#c7c0b4]">
            No es solo un bot ni solo senales. CARVIPIX integra analisis, automatizacion, comunidad y herramientas operativas en una sola experiencia.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Zap, label: "Alertas en Vivo", desc: "Señales en tiempo real sobre XAUUSD, EURUSD, GBPUSD y BTCUSD con análisis estructural." },
            { icon: Bot, label: "Bot EA MT5", desc: "Expert Advisor descargable e instalable en MetaTrader 5. Opera automáticamente según tu configuración." },
            { icon: TrendingUp, label: "Resultados", desc: "Historial verificado de actividad operativa, win rate y seguimiento descriptivo del sistema." },
            { icon: Users, label: "Comunidad", desc: "Acceso a canales privados, analisis en grupo y actualizaciones directas del equipo CARVIPIX." },
            { icon: Wallet, label: "Programa de Fondeo", desc: "Proximamente: informacion oficial sobre un programa en preparacion, sin venta activa por ahora." },
            { icon: BarChart3, label: "Herramientas", desc: "Calculadoras de riesgo, gestión de posición, análisis de sesión y utilidades profesionales." },
          ].map(({ icon: Icon, label, desc }) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.08]">
              <Icon size={24} className="text-[#d4af37]" />
              <h3 className="mt-4 text-lg font-semibold">{label}</h3>
              <p className="mt-2 text-sm text-[#c7c0b4]">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── BOT EA MT5 ──────────────────────────────────────────────────────── */}
      <section aria-label="Bot CARVIPIX EA MT5" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-[#d4af37]/20 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.12),transparent_40%),linear-gradient(180deg,#0d1119_0%,#090c12_100%)] p-8 sm:p-12 lg:flex lg:items-center lg:gap-14">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">Bot CARVIPIX</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Expert Advisor MT5.<br />Automatización real.</h2>
            <p className="mt-5 text-[#c7c0b4]">
              El Bot CARVIPIX es un Expert Advisor desarrollado para MetaTrader 5. Se instala directamente en tu terminal, opera bajo la lógica validada del sistema y aplica gestión de riesgo en cada operación.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#c7c0b4]">
              {["Licencia de uso por pago único", "Entrega por correo con instrucciones", "Instalación guiada paso a paso", "Soporte de activación incluido", "Compatible con cualquier broker MT5"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-[#d4af37]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <CARVIPIXButtonLink href="/servicios" variant="primary" size="lg">
                Ver precio y adquirir <ArrowRight size={16} className="inline ml-1" />
              </CARVIPIXButtonLink>
            </div>
          </div>
          <div className="mt-10 lg:mt-0 lg:w-72 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
              <Bot size={48} className="mx-auto text-[#d4af37]" />
              <p className="mt-4 text-2xl font-bold">$999 USD</p>
              <p className="mt-1 text-sm text-[#c7c0b4]">Pago único · Licencia oficial</p>
              <p className="mt-3 text-xs text-[#c7c0b4]/70">90 días de soporte activo incluido</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALERTAS ─────────────────────────────────────────────────────────── */}
      <section aria-label="Alertas en vivo" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-8 sm:p-12 lg:flex lg:items-center lg:gap-14">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">Alertas en Vivo</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Señales con estructura.<br />No ruido.</h2>
            <p className="mt-5 text-[#c7c0b4]">
              Las alertas de CARVIPIX se generan cuando existen condiciones estructurales reales: confluencia de temporalidades, sesión activa y gestión de riesgo clara. No enviamos señales vacías.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[["XAUUSD", "Oro"], ["EURUSD", "Euro"], ["GBPUSD", "Libra"], ["BTCUSD", "Bitcoin"]].map(([sym, name]) => (
                <div key={sym} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="font-bold text-[#d4af37]">{sym}</p>
                  <p className="text-[#c7c0b4]">{name}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <CARVIPIXButtonLink href="/servicios" variant="secondary" size="lg">
                Ver plan de alertas
              </CARVIPIXButtonLink>
            </div>
          </div>
          <div className="mt-10 lg:mt-0 lg:w-64 shrink-0">
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-[#c7c0b4]">Plan BASIC</p>
                <p className="mt-1 text-xl font-bold">$19.99 <span className="text-sm font-normal text-[#c7c0b4]">/ mes</span></p>
                <p className="mt-1 text-xs text-[#c7c0b4]">Hasta 5 alertas por día</p>
              </div>
              <div className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-4">
                <p className="text-xs text-[#d4af37]">Plan PRO</p>
                <p className="mt-1 text-xl font-bold">$150 <span className="text-sm font-normal text-[#c7c0b4]">/ mes</span></p>
                <p className="mt-1 text-xs text-[#c7c0b4]">Acceso completo + herramientas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTADOS ──────────────────────────────────────────────────────── */}
      <section aria-label="Resultados" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d4af37]">Resultados</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Historial verificado de operaciones</h2>
          <p className="mt-4 mx-auto max-w-xl text-[#c7c0b4]">
            Aviso importante: el trading implica riesgo significativo de pérdida de capital. Los resultados históricos no garantizan rendimiento futuro.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Instrumentos activos", value: "4", sub: "XAUUSD, EURUSD, GBPUSD, BTCUSD" },
            { label: "Sistema de análisis", value: "V3", sub: "Maestro con IA y multi-temporalidad" },
            { label: "Gestión de riesgo", value: "Siempre", sub: "Stop loss en cada operación" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-4xl font-bold text-[#d4af37]">{value}</p>
              <p className="mt-2 font-semibold">{label}</p>
              <p className="mt-1 text-xs text-[#c7c0b4]">{sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <CARVIPIXButtonLink href="/resultados" variant="secondary" size="lg">
            Ver resultados completos
          </CARVIPIXButtonLink>
        </div>
      </section>

      {/* ── COMUNIDAD ───────────────────────────────────────────────────────── */}
      <section aria-label="Comunidad CARVIPIX" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-white/10 bg-[#0d1119] p-8 sm:p-12 text-center">
          <Users size={40} className="mx-auto text-[#d4af37]" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">Comunidad</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Forma parte de la comunidad</h2>
          <p className="mt-5 mx-auto max-w-xl text-[#c7c0b4]">
            Los miembros CARVIPIX acceden a canales privados, análisis en tiempo real, actualizaciones del sistema y soporte directo de los operadores del equipo.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <CARVIPIXButtonLink href="/comunidad" variant="secondary" size="lg">
              Explorar comunidad
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg">
              Unirme ahora
            </CARVIPIXButtonLink>
          </div>
        </div>
      </section>

      {/* ── FONDEO ──────────────────────────────────────────────────────────── */}
      <section aria-label="Programa de Fondeo" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-[#d4af37]/20 bg-black/40 p-8 sm:p-12 lg:flex lg:items-center lg:gap-12">
          <div className="flex-1">
            <p className="inline-flex rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#d4af37]">
              Próximamente
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">Programa de Fondeo</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Programa en preparacion para traders calificados</h2>
            <p className="mt-5 text-[#c7c0b4]">
              CARVIPIX prepara una propuesta de evaluacion para traders calificados. Mientras no exista lanzamiento formal, esta seccion es informativa y no representa venta activa ni promesa de acceso.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#c7c0b4]">
              {["Evaluacion estructurada", "Reglas operativas definidas", "Publicacion oficial al lanzamiento", "Sin venta activa por ahora"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Star size={14} className="shrink-0 text-[#d4af37]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 lg:mt-0 shrink-0">
            <CARVIPIXButtonLink href="/fondeo" variant="secondary" size="lg">
              Más información
            </CARVIPIXButtonLink>
          </div>
        </div>
      </section>

      {/* ── PLANES ──────────────────────────────────────────────────────────── */}
      <section aria-label="Planes y precios" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#d4af37]">Planes</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Elige el nivel que necesitas</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              name: "FREE",
              price: "$0",
              period: "",
              desc: "Acceso básico para conocer la plataforma.",
              features: ["Dashboard básico", "Información pública", "Acceso a comunidad"],
              highlight: false,
            },
            {
              name: "BASIC",
              price: "$19.99",
              period: "/ mes",
              desc: "Alertas en vivo con análisis estructural.",
              features: ["Hasta 5 alertas por día", "XAUUSD y BTCUSD", "Dashboard del cliente", "Historial de alertas", "Estadísticas básicas"],
              highlight: false,
            },
            {
              name: "PRO",
              price: "$150",
              period: "/ mes",
              desc: "Acceso completo a todos los módulos.",
              features: ["Todo BASIC incluido", "Más activos y alertas", "Herramientas premium", "Análisis completos", "Estadísticas avanzadas", "Videos y reportes"],
              highlight: true,
            },
          ].map(({ name, price, period, desc, features, highlight }) => (
            <article
              key={name}
              className={`rounded-2xl border p-6 ${highlight ? "border-[#d4af37]/50 bg-[#d4af37]/10" : "border-white/10 bg-white/5"}`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.24em] ${highlight ? "text-[#d4af37]" : "text-[#c7c0b4]"}`}>{name}</p>
              <p className="mt-3 text-3xl font-bold">{price} <span className="text-sm font-normal text-[#c7c0b4]">{period}</span></p>
              <p className="mt-2 text-sm text-[#c7c0b4]">{desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-[#c7c0b4]">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-[#d4af37]" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CARVIPIXButtonLink href="/registro" variant={highlight ? "primary" : "secondary"} size="lg" fullWidth>
                  Comenzar
                </CARVIPIXButtonLink>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#c7c0b4]/70">
          El Bot CARVIPIX EA MT5 se adquiere por separado como licencia única de $999 USD.
        </p>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section aria-label="Llamada a la acción" className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-[#d4af37]/30 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_60%)] p-10 text-center sm:p-16">
          <ShieldCheck size={36} className="mx-auto text-[#d4af37]" />
          <h2 className="mt-5 text-3xl font-bold sm:text-5xl">Comienza hoy en CARVIPIX</h2>
          <p className="mt-5 mx-auto max-w-xl text-[#c7c0b4]">
            Crea tu cuenta, elige tu plan y accede a una plataforma tecnologica para traders con enfoque en transparencia y control operativo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg">
              Crear cuenta gratuita
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/servicios" variant="secondary" size="lg">
              Ver todos los planes
            </CARVIPIXButtonLink>
          </div>
          <p className="mt-6 text-xs text-[#c7c0b4]/60">
            El trading implica riesgo significativo. CARVIPIX proporciona herramientas e información. No garantizamos resultados.
          </p>
        </div>
      </section>

    </main>
  );
}
