import { LifeBuoy, MessageSquare, Shield } from "lucide-react";

export default function SoportePage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Soporte
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Asistencia al usuario</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Centro de ayuda con opciones de contacto y estado del servicio.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Respuesta</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">24h</p>
            <p className="mt-1 text-sm text-zinc-500">Servicio de soporte en desarrollo.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <LifeBuoy size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Soporte</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Tickets</p>
            <p className="mt-3 text-sm text-zinc-400">En espera de integración real.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <MessageSquare size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Chat</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">Disponible</p>
            <p className="mt-3 text-sm text-zinc-400">Interfaz lista para conectar mensajería.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <Shield size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Seguridad</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Protegido</p>
            <p className="mt-3 text-sm text-zinc-400">Canales seguros para soporte.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold">Contacto</h2>
          <p className="mt-2 text-sm text-zinc-400">Esta sección está preparada para integrar formularios de solicitud y tickets.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Email</p>
              <p className="mt-2 text-lg font-semibold text-white">soporte@carvipix.com</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Teléfono</p>
              <p className="mt-2 text-lg font-semibold text-[#D4AF37]">+34 910 000 000</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
