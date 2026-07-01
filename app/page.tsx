import Image from "next/image";

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
  { title: "Operaciones totales", value: "128", note: "Últimos 30 días", color: "text-white" },
  { title: "Win Rate", value: "69.5%", note: "89 ganadoras", color: "text-green-400" },
  { title: "Ganancia total", value: "+8,742.50", note: "USD últimos 30 días", color: "text-[#D4AF37]" },
  { title: "Riesgo/beneficio", value: "1.87", note: "Promedio", color: "text-purple-400" },
];

const alerts = [
  { asset: "XAUUSD", type: "Compra", entry: "2338.45", tp: "2345.00", status: "Activa", color: "text-green-400" },
  { asset: "BTCUSD", type: "Compra", entry: "61520.00", tp: "62880.00", status: "+3.12%", color: "text-green-400" },
  { asset: "EURUSD", type: "Venta", entry: "1.07153", tp: "1.06900", status: "TP cerca", color: "text-[#D4AF37]" },
];

const quickAccess = [
  "Alertas en Vivo",
  "Resultados",
  "Análisis Diario",
  "Comunidad",
  "Bot CARVIPIX",
  "Gestión de Capital",
  "Fondeo",
  "Academia",
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

            <div className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#10141D]/90 p-5 shadow-2xl shadow-[#D4AF37]/10">
              <p className="text-sm text-zinc-400">Plan actual</p>
              <p className="mt-2 text-xl font-bold text-[#D4AF37]">CARVIPIX PRO</p>
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
                Servidor: <span className="font-semibold text-white">14:36:22</span>
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
                🔔
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
            <div className="mb-8 flex items-center justify-between gap-6">
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
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[#D4AF37]/10"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/20" />
                  <p className="relative text-xs uppercase tracking-wide text-zinc-500">{stat.title}</p>
                  <p className={`relative mt-4 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="relative mt-2 text-sm text-zinc-500">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Evolución de Balance</h2>
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">
                    Últimos 30 días
                  </button>
                </div>

                <div className="relative h-72 overflow-hidden rounded-xl border border-white/5 bg-black/25 p-6">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

                  <svg className="relative h-full w-full" viewBox="0 0 700 260" fill="none">
                    <path
                      d="M20 210 C90 175 125 190 175 150 C230 110 260 145 325 98 C390 45 425 85 490 52 C555 20 610 42 680 18"
                      stroke="#D4AF37"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="900"
                      strokeDashoffset="0"
                      className="drop-shadow-[0_0_18px_rgba(212,175,55,0.8)]"
                    />
                    <path
                      d="M20 210 C90 175 125 190 175 150 C230 110 260 145 325 98 C390 45 425 85 490 52 C555 20 610 42 680 18 L680 260 L20 260 Z"
                      fill="url(#goldGradient)"
                      opacity="0.28"
                    />
                    <circle cx="680" cy="18" r="8" fill="#D4AF37" className="drop-shadow-[0_0_18px_rgba(212,175,55,0.9)]" />
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop stopColor="#D4AF37" />
                        <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute bottom-8 right-8 rounded-xl border border-[#D4AF37]/30 bg-black/70 px-4 py-3 shadow-xl shadow-[#D4AF37]/10">
                    <p className="text-xs text-zinc-400">Balance actual</p>
                    <p className="text-lg font-bold text-[#D4AF37]">$8,742.50</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/30">
                <h2 className="mb-6 text-xl font-bold">Alertas activas</h2>

                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.asset}
                      className="group rounded-xl border border-white/5 bg-black/25 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/10"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{alert.asset}</p>
                        <span className={`text-sm font-bold ${alert.color}`}>{alert.status}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-bold">Accesos rápidos</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {quickAccess.map((item) => (
                <div
                  key={item}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/25" />
                  <p className="relative text-lg font-bold">{item}</p>
                  <p className="relative mt-2 text-sm text-zinc-500">Acceder ahora</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}