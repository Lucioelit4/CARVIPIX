"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { CARVIPIXButton } from "@/app/design-system";

type Props = {
  open: boolean;
  onClose: () => void;
};

const OFFICIAL_PLANS = [
  {
    title: "FREE",
    price: "0 USD",
    description: "Informacion general, noticias y comunidad.",
    features: ["Noticias", "Comunidad", "Sin alertas completas", "Sin Bot"],
    href: "/dashboard",
    cta: "Entrar con FREE",
  },
  {
    title: "BASIC",
    price: "49 USD",
    description: "Alertas manuales, pares limitados, historial limitado y bot limitado.",
    features: ["Alertas manuales", "4 pares", "5 alertas/día", "1 bot"],
    href: "/checkout?product=plan-basic",
    cta: "Comprar BASIC",
  },
  {
    title: "ADVANCED",
    price: "149 USD",
    description: "Mas pares, mas alertas, mas historial y bot completo.",
    features: ["12 pares", "25 alertas/día", "3 bots", "Historial ampliado"],
    href: "/checkout?product=plan-advanced",
    cta: "Comprar ADVANCED",
  },
];

export default function PlansModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0B1220]/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Planes oficiales CARVIPIX</h3>
            <p className="mt-1 text-sm text-slate-400">Una sola implementación comercial: FREE, BASIC y ADVANCED.</p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="cv-icon-btn">
            <X />
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {OFFICIAL_PLANS.map((plan) => (
            <div key={plan.title} className="rounded-xl border border-white/10 bg-[#121212]/90 p-5">
              <p className="text-sm font-semibold text-[#D4AF37]">{plan.title}</p>
              <p className="mt-2 text-3xl font-bold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="mt-5">
                <Link href={plan.href} onClick={onClose}>
                  <CARVIPIXButton variant={plan.title === "ADVANCED" ? "premium" : "secondary"} size="md" fullWidth>
                    {plan.cta}
                  </CARVIPIXButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
