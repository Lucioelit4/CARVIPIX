import { UserCheck, UserCog, UserPlus } from "lucide-react";

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
              Perfil
            </p>
            <h1 className="mt-5 text-4xl font-bold text-[#D4AF37]">Mi cuenta</h1>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Información de perfil y preferencias con estilo CARVIPIX oscuro/dorado.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-xl shadow-[#D4AF37]/10">
            <p className="text-sm text-zinc-400">Miembro</p>
            <p className="mt-2 text-2xl font-bold text-[#D4AF37]">PRO</p>
            <p className="mt-1 text-sm text-zinc-500">Configuración de cuenta.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <UserCheck size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Usuario</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Abraham B.</p>
            <p className="mt-3 text-sm text-zinc-400">Trader CARVIPIX.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <UserCog size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Ajustes</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-[#D4AF37]">Privacidad</p>
            <p className="mt-3 text-sm text-zinc-400">Configuración de cuenta y notificaciones.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <UserPlus size={22} />
              <span className="text-sm uppercase tracking-[0.16em]">Cuenta</span>
            </div>
            <p className="mt-6 text-3xl font-bold text-white">Demo</p>
            <p className="mt-3 text-sm text-zinc-400">Datos representativos para diseño.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#10141D]/90 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-bold">Preferencias</h2>
          <p className="mt-2 text-sm text-zinc-400">Sección lista para conectar con ajustes reales de usuario.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Correo</p>
              <p className="mt-2 text-lg font-semibold text-white">abraham@example.com</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-zinc-400">Idioma</p>
              <p className="mt-2 text-lg font-semibold text-[#D4AF37]">Español</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
