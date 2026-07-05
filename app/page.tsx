import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Gauge,
  LineChart,
  Lock,
  ShieldCheck,
  Signal,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

const trustStats = [
  {
    label: "Entorno operativo",
    value: "24/7",
    detail: "Monitoreo continuo de contexto, alertas y prioridad de señal.",
  },
  {
    label: "Marco de ejecución",
    value: "3 capas",
    detail: "Lectura, interpretación y acción recomendada dentro de una misma superficie.",
  },
  {
    label: "Tono de riesgo",
    value: "Sobrio",
    detail: "Información accionable sin ruido visual, sin alarmismo y sin promesas irreales.",
  },
];

const motorSteps = [
  {
    icon: Signal,
    eyebrow: "Capa 01",
    title: "Lectura estructural del mercado",
    description:
      "CARVIPIX prioriza contexto antes que impulso. La primera capa concentra dirección, zonas y fricción real del mercado.",
  },
  {
    icon: Workflow,
    eyebrow: "Capa 02",
    title: "Interpretación con criterio operativo",
    description:
      "La segunda capa ordena la señal, jerarquiza probabilidad y traduce complejidad en una lectura utilizable.",
  },
  {
    icon: Target,
    eyebrow: "Capa 03",
    title: "Acción disciplinada",
    description:
      "La salida final no busca impresionar. Busca ayudarte a decidir con mayor consistencia, control y velocidad mental.",
  },
];

const alertFeed = [
  {
    asset: "XAUUSD",
    title: "Cambio de contexto detectado",
    detail: "La presión compradora gana prioridad sobre el rango de apertura.",
    level: "Alta",
    tone: "emerald",
  },
  {
    asset: "BTCUSD",
    title: "Oportunidad bajo observación",
    detail: "Expansión válida, pero la entrada exige confirmación secundaria.",
    level: "Media",
    tone: "amber",
  },
  {
    asset: "EURUSD",
    title: "Riesgo en aumento",
    detail: "Compresión de rango y liquidez mixta. Mantener prudencia operativa.",
    level: "Baja",
    tone: "sky",
  },
];

const resultStats = [
  {
    label: "Lectura priorizada",
    value: "Señales visibles por jerarquía",
    note: "El usuario identifica primero contexto, después acción.",
  },
  {
    label: "Disciplina visual",
    value: "Contraste de riesgo calibrado",
    note: "Alertas legibles sin convertir la experiencia en ruido.",
  },
  {
    label: "Ritmo operativo",
    value: "Navegación clara y progresiva",
    note: "El home reduce fricción antes de llegar al panel real.",
  },
];

const comparisonRows = [
  {
    label: "Señal",
    conventional: "Widgets sin prioridad",
    carvipix: "Jerarquizada por importancia operativa",
  },
  {
    label: "Riesgo",
    conventional: "Color agresivo y reactivo",
    carvipix: "Codificación sobria, legible y responsable",
  },
  {
    label: "Panel",
    conventional: "Complejo desde el inicio",
    carvipix: "Vista guiada antes de exponer profundidad",
  },
];

const footerLinks = [
  { href: "/legal", label: "Aviso legal" },
  { href: "/terms", label: "Términos" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/risk-disclosure", label: "Riesgo" },
  { href: "/cookies", label: "Cookies" },
];

function toneClasses(tone: string) {
  if (tone === "emerald") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }

  if (tone === "amber") {
    return "border-[#c8a24d]/30 bg-[#c8a24d]/10 text-[#f3d899]";
  }

  return "border-sky-400/30 bg-sky-400/10 text-sky-200";
}

export default function Home() {
  return (
    <main className="cv-home relative overflow-hidden bg-[#05070b] text-[#f5f1e8]">
      <div className="cv-home__backdrop" aria-hidden="true" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#05070b]/72 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-full max-w-[1584px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-[72px]">
          <Link href="/" className="flex items-center gap-4 text-[#f5f1e8] transition hover:opacity-95">
            <Image
              src="/logo/logo carvipix.png"
              alt="CARVIPIX"
              width={176}
              height={44}
              priority
              className="h-auto w-[148px] sm:w-[176px]"
            />
            <span className="hidden border-l border-white/10 pl-4 text-[11px] uppercase tracking-[0.28em] text-[#c8c0b2] md:inline-flex">
              Trading intelligence platform
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#d4af37]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
              Monitoreo continuo
            </div>
            <nav className="flex items-center gap-6 text-sm text-[#b9b3a6]">
              <a href="#motor" className="transition hover:text-white">Motor</a>
              <a href="#panel" className="transition hover:text-white">Panel</a>
              <a href="#alertas" className="transition hover:text-white">Alertas</a>
              <a href="#resultados" className="transition hover:text-white">Resultados</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#c8c0b2] sm:flex">
              <Bell size={16} className="text-[#d4af37]" />
              Alertas con prioridad visual
            </div>
            <Link href="/soporte" className="cv-button cv-button--ghost">
              Soporte
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[84vh] w-full max-w-[1584px] gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-6 lg:px-[72px] lg:py-24">
        <div className="flex flex-col justify-center gap-8 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="cv-kicker">Sistema de decisión institucional</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#c8c0b2]">
              <ShieldCheck size={14} className="text-[#d4af37]" />
              Claridad, disciplina y contexto
            </span>
          </div>

          <div className="max-w-[820px] space-y-6">
            <h1 className="cv-display text-[3rem] leading-[0.95] tracking-[-0.04em] text-[#f5f1e8] sm:text-[4.35rem] lg:text-[5.7rem]">
              Trading con una lectura más limpia, una señal más clara y una decisión más sobria.
            </h1>
            <p className="max-w-[640px] text-lg leading-8 text-[#c8c0b2] sm:text-xl">
              CARVIPIX convierte la complejidad del mercado en una superficie premium de trabajo:
              contexto primero, acción después y riesgo siempre visible.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/resultados" className="cv-button cv-button--primary">
              Ver la experiencia
              <ArrowRight size={18} />
            </Link>
            <Link href="#panel" className="cv-button cv-button--secondary">
              Explorar el panel
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid gap-4 pt-2 md:grid-cols-3">
            {trustStats.map((item) => (
              <article key={item.label} className="cv-surface p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">{item.label}</p>
                <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#f5f1e8]">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-[#b9b3a6]">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative flex items-center lg:col-span-5 lg:justify-end">
          <div className="cv-hero-panel w-full max-w-[560px]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-[#8f897d]">Live command center</p>
                <p className="mt-2 text-lg font-semibold text-[#f5f1e8]">Vista previa del entorno CARVIPIX</p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                Operativo
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <article className="rounded-[28px] border border-white/8 bg-[#121212]/95 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#c8c0b2]">Contexto de mercado</p>
                    <Activity size={16} className="text-[#d4af37]" />
                  </div>
                  <p className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-[#f5f1e8]">Alto</p>
                  <p className="mt-3 text-sm leading-6 text-[#8f897d]">
                    Dirección definida, fricción contenida y lectura favorable para seguimiento disciplinado.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {[64, 82, 71].map((value, index) => (
                      <div key={index} className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f897d]">
                          {index === 0 ? "Dirección" : index === 1 ? "Impulso" : "Riesgo"}
                        </p>
                        <p className="mt-2 text-xl font-medium text-[#f5f1e8]">{value}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[28px] border border-white/8 bg-[#111923]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#c8c0b2]">Prioridad de alerta</p>
                    <Bell size={16} className="text-[#d4af37]" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                      Confirmación con momentum limpio
                    </div>
                    <div className="rounded-2xl border border-[#c8a24d]/25 bg-[#c8a24d]/10 px-4 py-3 text-sm text-[#f4da9a]">
                      Revisión secundaria recomendada
                    </div>
                    <div className="rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
                      Mantener paciencia operativa
                    </div>
                  </div>
                </article>
              </div>

              <article className="rounded-[30px] border border-white/8 bg-[#0a0f18]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Línea de decisión</p>
                    <p className="mt-2 text-lg font-semibold text-[#f5f1e8]">Rendimiento de lectura por sesión</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#c8c0b2]">
                    <Clock3 size={14} className="text-[#d4af37]" />
                    Últimos 30 días
                  </div>
                </div>

                <div className="mt-7 flex h-40 items-end gap-3">
                  {[42, 54, 50, 68, 72, 74, 88, 84, 93, 98].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col justify-end gap-3">
                      <div
                        className="rounded-t-[18px] bg-[linear-gradient(180deg,rgba(212,175,55,0.85),rgba(64,86,123,0.28))] shadow-[0_12px_30px_rgba(212,175,55,0.12)]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-center text-[10px] uppercase tracking-[0.2em] text-[#6f6a61]">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1584px] gap-6 px-5 pb-14 sm:px-8 lg:grid-cols-12 lg:px-[72px] lg:pb-24" id="motor">
        <div className="lg:col-span-4">
          <span className="cv-kicker">Motor</span>
          <h2 className="cv-display mt-6 text-5xl leading-none tracking-[-0.04em] text-[#f5f1e8]">
            El sistema no adivina. Procesa.
          </h2>
          <p className="mt-6 max-w-[460px] text-lg leading-8 text-[#b9b3a6]">
            La home presenta el motor como una secuencia de lectura industrial: identifica, ordena y propone una acción con mayor contexto.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 lg:col-span-8">
          {motorSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="cv-surface cv-hover-lift p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4af37]/15 bg-[#d4af37]/10 text-[#d4af37]">
                  <Icon size={20} />
                </div>
                <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">{step.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#f5f1e8]">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#b9b3a6]">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1584px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-[72px] lg:py-24" id="panel">
        <div className="space-y-6 lg:col-span-4">
          <span className="cv-kicker">Panel</span>
          <h2 className="cv-display text-5xl leading-none tracking-[-0.04em] text-[#f5f1e8]">
            Una superficie de trabajo pensada para decidir.
          </h2>
          <p className="text-lg leading-8 text-[#b9b3a6]">
            El preview del Dashboard elimina incertidumbre antes de entrar: contexto, alertas, rendimiento y decisiones en un solo plano visual.
          </p>
          <div className="space-y-4 text-sm text-[#c8c0b2]">
            <div className="flex items-start gap-3">
              <Eye size={18} className="mt-0.5 text-[#d4af37]" />
              <p>La visión general domina la composición y evita que el usuario se pierda en módulos secundarios.</p>
            </div>
            <div className="flex items-start gap-3">
              <Gauge size={18} className="mt-0.5 text-[#d4af37]" />
              <p>Los indicadores aparecen agrupados por función, no por exceso de datos.</p>
            </div>
            <div className="flex items-start gap-3">
              <Lock size={18} className="mt-0.5 text-[#d4af37]" />
              <p>La profundidad visual transmite software institucional, no una landing decorativa.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="cv-panel-shell">
            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[30px] border border-white/8 bg-[#0a0f17] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Visión general</p>
                    <p className="mt-2 text-lg font-semibold text-[#f5f1e8]">Panel principal</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#c8c0b2]">
                    <Sparkles size={14} className="text-[#d4af37]" />
                    Layout jerarquizado
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[0.74fr_0.26fr]">
                  <div className="rounded-[26px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_50%),linear-gradient(180deg,#101a29_0%,#0d1219_100%)] p-5">
                    <div className="flex items-center justify-between text-sm text-[#c8c0b2]">
                      <span>Lectura dominante</span>
                      <LineChart size={16} className="text-[#d4af37]" />
                    </div>
                    <div className="mt-5 h-52 rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
                      <div className="flex h-full items-end gap-2">
                        {[26, 36, 42, 40, 52, 58, 64, 62, 71, 82, 89, 96].map((value, index) => (
                          <div key={index} className="flex h-full flex-1 items-end">
                            <div
                              className="w-full rounded-t-[16px] bg-[linear-gradient(180deg,rgba(212,175,55,0.95),rgba(212,175,55,0.18))]"
                              style={{ height: `${value}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      ["Alertas", "4 activas"],
                      ["Riesgo", "Controlado"],
                      ["Flujo", "Ordenado"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8f897d]">{label}</p>
                        <p className="mt-3 text-xl font-semibold text-[#f5f1e8]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-white/8 bg-[#0d151f] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Llamadas visuales</p>
                  <ul className="mt-5 space-y-4 text-sm leading-6 text-[#c8c0b2]">
                    <li className="flex gap-3"><CheckCircle2 size={16} className="mt-1 text-[#d4af37]" /> Zona principal primero.</li>
                    <li className="flex gap-3"><CheckCircle2 size={16} className="mt-1 text-[#d4af37]" /> Alertas secundarias pero legibles.</li>
                    <li className="flex gap-3"><CheckCircle2 size={16} className="mt-1 text-[#d4af37]" /> Métricas sin densidad innecesaria.</li>
                  </ul>
                </div>
                <div className="rounded-[28px] border border-white/8 bg-[#0b1018] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Propósito</p>
                  <p className="mt-4 text-base leading-7 text-[#c8c0b2]">
                    Esta vista valida que el producto existe, que está ordenado y que la profundidad técnica no sacrifica claridad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1584px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-[72px] lg:py-24" id="alertas">
        <div className="lg:col-span-4">
          <span className="cv-kicker">Alertas</span>
          <h2 className="cv-display mt-6 text-5xl leading-none tracking-[-0.04em] text-[#f5f1e8]">
            Vigilancia activa sin ruido visual.
          </h2>
          <p className="mt-6 max-w-[470px] text-lg leading-8 text-[#b9b3a6]">
            La home debe demostrar que CARVIPIX avisa lo importante y omite lo accesorio. La prioridad se entiende antes de leer cada línea.
          </p>
        </div>

        <div className="grid gap-4 lg:col-span-8">
          {alertFeed.map((alert) => (
            <article key={alert.asset} className="cv-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClasses(alert.tone)}`}>
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">{alert.asset}</p>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${toneClasses(alert.tone)}`}>
                      Prioridad {alert.level}
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#f5f1e8]">{alert.title}</h3>
                  <p className="mt-3 max-w-[560px] text-sm leading-7 text-[#b9b3a6]">{alert.detail}</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-[#c8c0b2] sm:max-w-[260px]">
                Mensaje corto, accionable y sin dramatización cromática.
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1584px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:px-[72px] lg:py-24" id="resultados">
        <div className="space-y-6 lg:col-span-4">
          <span className="cv-kicker">Resultados</span>
          <h2 className="cv-display text-5xl leading-none tracking-[-0.04em] text-[#f5f1e8]">
            Evidencia con contexto, no triunfalismo.
          </h2>
          <p className="text-lg leading-8 text-[#b9b3a6]">
            Los resultados en HOME deben sostener la credibilidad del sistema mientras preservan un tono institucional y responsable.
          </p>
        </div>

        <div className="space-y-5 lg:col-span-8">
          <div className="grid gap-4 md:grid-cols-3">
            {resultStats.map((item) => (
              <article key={item.label} className="cv-surface p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">{item.label}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#f5f1e8]">{item.value}</h3>
                <p className="mt-3 text-sm leading-7 text-[#b9b3a6]">{item.note}</p>
              </article>
            ))}
          </div>

          <div className="cv-surface overflow-hidden p-0">
            <div className="grid divide-y divide-white/6 lg:grid-cols-[0.36fr_0.64fr] lg:divide-x lg:divide-y-0">
              <div className="p-6 sm:p-8">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Ventaja diferencial</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#f5f1e8]">
                  Menos ruido. Más criterio.
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#b9b3a6]">
                  El home contrasta explícitamente el enfoque CARVIPIX con interfaces genéricas saturadas de widgets y color reactivo.
                </p>
              </div>

              <div className="overflow-x-auto p-6 sm:p-8">
                <table className="w-full min-w-[560px] border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">
                      <th className="pb-2 pr-4 font-medium">Capa</th>
                      <th className="pb-2 pr-4 font-medium">Convencional</th>
                      <th className="pb-2 font-medium text-[#d4af37]">CARVIPIX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label}>
                        <td className="rounded-l-2xl border border-white/6 bg-white/[0.02] px-4 py-4 text-sm font-medium text-[#f5f1e8]">
                          {row.label}
                        </td>
                        <td className="border-y border-white/6 bg-white/[0.02] px-4 py-4 text-sm text-[#b9b3a6]">
                          {row.conventional}
                        </td>
                        <td className="rounded-r-2xl border border-[#d4af37]/20 bg-[#d4af37]/8 px-4 py-4 text-sm text-[#f3e2ab]">
                          {row.carvipix}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1584px] px-5 py-14 sm:px-8 lg:px-[72px] lg:py-24">
        <div className="cv-cta-shell grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:min-h-[420px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:py-14">
          <div className="max-w-[680px]">
            <span className="cv-kicker">CTA</span>
            <h2 className="cv-display mt-6 text-[3rem] leading-[0.96] tracking-[-0.04em] text-[#f5f1e8] sm:text-[4.2rem]">
              Una experiencia construida para traders que valoran criterio antes que ruido.
            </h2>
            <p className="mt-6 max-w-[560px] text-lg leading-8 text-[#c8c0b2]">
              CARVIPIX presenta un entorno premium, disciplinado y listo para sostener una rutina seria de mercado.
            </p>
          </div>

          <div className="grid gap-4 lg:justify-items-end">
            <Link href="/resultados" className="cv-button cv-button--primary w-full justify-center sm:w-auto sm:min-w-[240px]">
              Entrar a CARVIPIX
              <ArrowRight size={18} />
            </Link>
            <Link href="/soporte" className="cv-button cv-button--secondary w-full justify-center sm:w-auto sm:min-w-[240px]">
              Hablar con soporte
            </Link>
            <p className="max-w-[360px] text-sm leading-7 text-[#8f897d] lg:text-right">
              El trading implica riesgo significativo. La plataforma debe comunicar control, no falsas garantías.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[#05070b]">
        <div className="mx-auto grid w-full max-w-[1584px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.42fr_0.3fr_0.28fr] lg:px-[72px] lg:py-14">
          <div>
            <Image
              src="/logo/logo carvipix.png"
              alt="CARVIPIX"
              width={170}
              height={42}
              className="h-auto w-[150px]"
            />
            <p className="mt-5 max-w-[440px] text-sm leading-7 text-[#a39c90]">
              Plataforma premium de trading diseñada para transformar complejidad en claridad operativa, con identidad institucional y disciplina visual.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Navegación secundaria</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#c8c0b2] transition hover:border-[#d4af37]/30 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f897d]">Responsabilidad</p>
            <p className="mt-5 text-sm leading-7 text-[#a39c90]">
              CARVIPIX ofrece herramientas y contexto de análisis. No garantiza rendimientos ni elimina el riesgo inherente al mercado.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-[#c8c0b2]">
              <BarChart3 size={16} className="text-[#d4af37]" />
              Software de alto nivel con comunicación responsable.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
