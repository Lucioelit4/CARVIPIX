import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0F1117]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8 gap-4">
        <a href="#" className="flex items-center transition duration-300 hover:scale-105">
          <Image
            src="/logo/logo carvipix.png"
            alt="CARVIPIX"
            width={260}
            height={70}
            priority
          />
        </a>

        <nav className="hidden items-center gap-10 rounded-full border border-white/10 bg-white/[0.03] px-8 py-3 text-sm font-medium text-zinc-300 shadow-lg shadow-black/20 lg:flex">
          <a href="#" className="transition hover:text-[#D4AF37]">Inicio</a>
          <a href="#" className="transition hover:text-[#D4AF37]">Alertas</a>
          <a href="#" className="transition hover:text-[#D4AF37]">Bot</a>
          <a href="#" className="transition hover:text-[#D4AF37]">Fondeo</a>
          <a href="#" className="transition hover:text-[#D4AF37]">Resultados</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-[#D4AF37] px-8 py-3.5 font-bold text-black shadow-lg shadow-[#D4AF37]/20 transition duration-300 hover:scale-105 hover:bg-[#f0c94a]">
            Comenzar
          </button>
        </div>
      </div>
    </header>
  );
}