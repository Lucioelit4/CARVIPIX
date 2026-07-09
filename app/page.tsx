import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { CARVIPIXButtonLink } from "@/app/design-system";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070b] text-[#f5f1e8]">
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%),linear-gradient(180deg,#121620_0%,#090c12_100%)] p-8 sm:p-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">Hero principal</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            CARVIPIX, plataforma profesional para operar con claridad.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#c7c0b4] sm:text-lg">
            Señales, capital, membresías y control operativo en una experiencia unificada para visitantes y clientes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg">
              Crear cuenta
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/login" variant="secondary" size="lg">
              Iniciar sesión
            </CARVIPIXButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-3 lg:px-14">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Beneficios</p>
          <h2 className="mt-3 text-2xl font-semibold">Decisiones con menos fricción</h2>
          <p className="mt-3 text-sm text-[#c7c0b4]">Visibilidad de alertas, capital y reportes con lectura ordenada.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Servicios</p>
          <h2 className="mt-3 text-2xl font-semibold">Alertas, capital y soporte</h2>
          <p className="mt-3 text-sm text-[#c7c0b4]">Servicios integrados con validación backend y estados controlados mientras cada módulo completa su activación operativa.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Planes</p>
          <h2 className="mt-3 text-2xl font-semibold">Escalable por etapa</h2>
          <p className="mt-3 text-sm text-[#c7c0b4]">Desde entrada inicial hasta operación avanzada con control de acceso.</p>
        </article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:px-14">
        <article className="rounded-2xl border border-white/10 bg-[#0d1119] p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Seguridad</p>
          <h2 className="mt-3 text-3xl font-semibold">Protección y sesiones controladas</h2>
          <div className="mt-5 space-y-3 text-sm text-[#c7c0b4]">
            <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#d4af37]" />Control de acceso por rol</p>
            <p className="flex items-center gap-2"><LockKeyhole size={16} className="text-[#d4af37]" />Dashboard restringido para visitantes</p>
            <p className="flex items-center gap-2"><Sparkles size={16} className="text-[#d4af37]" />Trazabilidad de flujos críticos</p>
          </div>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0d1119] p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Cómo funciona</p>
          <h2 className="mt-3 text-3xl font-semibold">3 pasos para empezar</h2>
          <ol className="mt-5 space-y-3 text-sm text-[#c7c0b4]">
            <li>1. Crear cuenta desde la página pública.</li>
            <li>2. Iniciar sesión con rol de cliente.</li>
            <li>3. Acceder a módulos habilitados según membresía.</li>
          </ol>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-14">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">Preguntas frecuentes</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">¿Puedo entrar al Dashboard sin sesión?</h3>
              <p className="mt-2 text-sm text-[#c7c0b4]">No. El acceso está restringido para visitantes.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">¿Qué pasa si no hay datos?</h3>
              <p className="mt-2 text-sm text-[#c7c0b4]">La plataforma muestra estados guiados para ayudarte a activar cada servicio y comenzar con claridad.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-14">
        <div className="rounded-3xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">CTA</p>
          <h2 className="mt-3 text-3xl font-semibold">Comienza hoy en CARVIPIX</h2>
          <p className="mt-3 text-sm text-[#c7c0b4]">Crea tu cuenta o inicia sesión para continuar.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <CARVIPIXButtonLink href="/registro" variant="primary" size="lg">
              Crear cuenta
            </CARVIPIXButtonLink>
            <CARVIPIXButtonLink href="/login" variant="secondary" size="lg">
              Iniciar sesión
            </CARVIPIXButtonLink>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#c7c0b4]">
            <CheckCircle2 size={14} className="text-[#d4af37]" />
            Página pública activa para visitantes.
          </p>
        </div>
      </section>
    </main>
  );
}
