import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#121212]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:h-24 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center transition duration-300 hover:scale-105">
          <Image
            src="/logo/logo carvipix.png"
            alt="CARVIPIX"
            width={260}
            height={70}
            priority
            className="h-auto w-[170px] sm:w-[220px]"
          />
        </Link>

        <nav className="hidden items-center gap-10 rounded-full border border-white/10 bg-white/[0.03] px-8 py-3 text-sm font-medium text-zinc-300 shadow-lg shadow-black/20 lg:flex">
          <Link href="/" className="transition hover:text-[#D4AF37]">Inicio</Link>
          <Link href="/alertas" className="transition hover:text-[#D4AF37]">Alertas</Link>
          <Link href="/bot" className="transition hover:text-[#D4AF37]">Bot</Link>
          <Link href="/fondeo" className="transition hover:text-[#D4AF37]">Fondeo</Link>
          <Link href="/resultados" className="transition hover:text-[#D4AF37]">Resultados</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#D4AF37]/20 transition duration-200 hover:scale-[1.02] hover:bg-[#f0c94a] sm:px-8 sm:text-base"
          >
            Comenzar
          </Link>
        </div>
      </div>
    </header>
  );
}