import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToDashboard() {
  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <Link
        href="/dashboard"
        className="inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#D4AF37] bg-[#0D1222]/95 px-4 py-3 text-sm font-semibold text-[#F5DEB3] shadow-2xl shadow-black/30 transition hover:bg-[#101823] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
      >
        <ArrowLeft size={16} />
        Volver al Dashboard
      </Link>
    </div>
  );
}
