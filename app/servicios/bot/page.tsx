import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

const faq = [
  {
    question: "¿Incluye el bot la membresía Elite?",
    answer: "No. El Bot CARVIPIX es un producto independiente con pago único y no está incluido en la membresía de 150 USD/mes.",
  },
  {
    question: "¿Funciona en MT4 y MT5?",
    answer: "Sí. El bot está diseñado para operar en plataformas MT4 y MT5 con gestión de riesgo integrada.",
  },
  {
    question: "¿Qué ocurre si cambia la estructura de mercado?",
    answer: "En caso de un cambio estructural fuerte, se podrá ofrecer una actualización crítica sin necesidad de membresía.",
  },
];

export default function ServiciosBotPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Bot CARVIPIX
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Bot para MT4/MT5</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Diseño pensado para buscar oportunidades con gestión de riesgo. Pago único de 999.00 USD. No promete ganancias garantizadas.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Precio</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">999.00 USD</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Beneficios</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                <li>Funciona en MT4 y MT5.</li>
                <li>Configuración para gestión de riesgo.</li>
                <li>Actualizaciones continuas para miembros Elite.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Claridad</h2>
              <p className="mt-4 text-zinc-300">El bot se adquiere por separado. Los miembros Elite tienen acceso a nuevas actualizaciones, pero no incluye la suscripción mensual.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Actualizaciones</h2>
              <p className="mt-4 text-zinc-300">Si hay un cambio estructural fuerte del mercado, se ofrecerá una actualización crítica fuera de la membresía estándar.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">¿Por qué elegir el bot?</h2>
              <p className="mt-4 text-zinc-300 leading-7">
                El Bot CARVIPIX es un producto premium independiente diseñado para integrarse con MT4 y MT5, con enfoque en gestión de riesgo y oportunidades estructuradas.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-white">Recordatorio</h2>
              <p className="mt-4 text-zinc-300 leading-7">
                Usuarios sin membresía conservan el bot fijo adquirido. La membresía Elite solo añade acceso a actualizaciones continuas.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 text-sm text-zinc-300">
            <h2 className="text-xl font-semibold text-white">Próxima actualización</h2>
            <p className="mt-4">
              Se preparan mejoras para optimizar la adaptación del bot a los cambios de estructura de mercado y mantener una base de gestión de riesgo responsable.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-white">Preguntas frecuentes</h2>
            <div className="mt-6 space-y-4">
              {faq.map((item) => (
                <div key={item.question} className="rounded-3xl border border-white/10 bg-[#0B1220]/90 p-4">
                  <p className="font-semibold text-white">{item.question}</p>
                  <p className="mt-2 text-zinc-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Compra segura</p>
              <p className="mt-2 text-zinc-300">Comprueba los términos y confirma tu inversión con responsabilidad.</p>
            </div>
            <Link
              href="/bot"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Comprar Bot CARVIPIX
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
