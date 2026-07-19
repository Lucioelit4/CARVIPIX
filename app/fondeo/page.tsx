import type { Metadata } from "next";
import BackToDashboard from "../components/BackToDashboard";

export const metadata: Metadata = {
  title: "Programa de Fondeo — CARVIPIX",
  description: "Informacion preliminar sobre el programa de fondeo CARVIPIX. Servicio en preparacion y sin venta activa.",
  alternates: { canonical: "https://carvipix.com/fondeo" },
  openGraph: {
    title: "Programa de Fondeo — CARVIPIX",
    url: "https://carvipix.com/fondeo",
  },
};

export default function FondeoPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <BackToDashboard />
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220]/95 p-10 shadow-2xl shadow-black/40 text-center">
          <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Cuentas Fondeadas
          </p>
          <h1 className="mt-8 text-5xl font-bold text-white sm:text-6xl">Próximamente</h1>
          <p className="mt-6 max-w-2xl mx-auto text-base leading-8 text-zinc-400 sm:text-lg">
            Este servicio esta en desarrollo. Por ahora no hay venta activa, precio, formulario, evaluacion ni checkout disponibles para este programa.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Estado</p>
              <p className="mt-4 text-3xl font-bold text-[#D4AF37]">En desarrollo</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Venta</p>
              <p className="mt-4 text-3xl font-bold text-white">Deshabilitada</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Checkout</p>
              <p className="mt-4 text-3xl font-bold text-white">No disponible</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
