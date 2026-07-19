import Link from "next/link";
import { TRUST_MODULES } from "../config";

type TrustNavProps = {
  currentPath?: string;
};

export default function TrustNav({ currentPath }: TrustNavProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Trust Center</p>
      <ul className="mt-4 space-y-2">
        {TRUST_MODULES.map((item) => {
          const active = currentPath === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-xl border px-3 py-2 text-sm transition ${
                  active
                    ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#F4C542]"
                    : "border-white/10 text-zinc-300 hover:border-[#D4AF37]/30 hover:text-[#F4C542]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
