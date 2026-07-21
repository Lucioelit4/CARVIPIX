import Image from "next/image";

import BackToDashboard from "./BackToDashboard";

export default function AcademiaComingSoon() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <BackToDashboard />

        <section className="mt-6 border-y border-[#D4AF37]/25 py-16 sm:py-24">
          <Image
            src="/logo/logo carvipix.png"
            alt="CARVIPIX"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
            priority
          />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Academia CARVIPIX
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-6xl">Próximamente</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Estamos preparando la nueva experiencia educativa de CARVIPIX. El contenido estará disponible en una próxima actualización.
          </p>
        </section>
      </div>
    </main>
  );
}