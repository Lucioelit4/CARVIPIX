import BackToDashboard from "../../components/BackToDashboard";
import Link from "next/link";

const messages = [
  { user: "Analyst", text: "Nueva idea en EURUSD para seguimiento." },
  { user: "Manager", text: "Recuerden confirmar el nivel de stop loss." },
  { user: "Miembro", text: "Gracias, me ayuda a mantener mi plan." },
];

export default function ServiciosComunidadPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Comunidad privada
              </p>
              <h1 className="mt-6 text-4xl font-bold text-white">Chat interno de CARVIPIX</h1>
              <p className="mt-4 max-w-2xl text-zinc-400">
                Un espacio privado estilo Telegram/Discord para preguntas, seguimiento de ideas y convivencia moderada.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6 text-right">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Moderación</p>
              <p className="mt-2 text-3xl font-bold text-[#D4AF37]">Moderada</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Beneficios</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                <li>Intercambio de ideas en tiempo real.</li>
                <li>Soporte para preguntas y señales.</li>
                <li>Ambiente privado y responsable.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Audiencia</h2>
              <p className="mt-4 text-zinc-300">Miembros activos que buscan apoyo y seguimiento profesional.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-6">
              <h2 className="text-xl font-semibold text-white">Reglas</h2>
              <p className="mt-4 text-zinc-300">Tu mensaje debe cumplir las reglas de convivencia. No se permiten spam ni ofensas.</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="mb-4 text-sm uppercase tracking-[0.2em] text-[#D4AF37]">Chat simulado</div>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className="rounded-3xl border border-white/5 bg-[#121212]/90 p-4">
                  <p className="text-sm text-zinc-400">{message.user}</p>
                  <p className="mt-2 text-white">{message.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Servicio comercial</p>
              <p className="mt-2 text-zinc-300">La comunidad privada es ideal para seguimiento, preguntas y respuestas con un ambiente moderado.</p>
            </div>
            <Link
              href="/comunidad"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#f5d76e]"
            >
              Entrar a comunidad
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
