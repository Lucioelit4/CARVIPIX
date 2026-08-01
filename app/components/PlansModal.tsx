"use client";

import Link from "next/link";
import { Check, Crown, Shield, Star, X } from "lucide-react";

import { COMMERCIAL_PRODUCTS } from "@/app/lib/commercial/business-model";

type Props = {
  open: boolean;
  onClose: () => void;
};

const OFFICIAL_PLANS = [
  {
    title: "FREE",
    subtitle: "Acceso inicial",
    badge: null,
    price: "0 USD",
    description: "Informacion general, noticias y comunidad.",
    features: [
      "Noticias",
      "Comunidad",
      "Grupo de Telegram gratuito",
      "De 1 a 2 alertas al día, cuando existan oportunidades válidas",
      "Sin acceso a todas las alertas",
      "BOT gratuito — próximamente",
      "BOT CARVIPIX premium por compra separada",
    ],
    href: "/dashboard",
    cta: "Entrar con FREE",
    tone: "free" as const,
  },
  ...COMMERCIAL_PRODUCTS.filter((item) => item.planCode === "basic" || item.planCode === "pro").map((item) => ({
    title: item.planCode === "basic" ? "BASIC" : "PRO",
    subtitle: item.planCode === "basic" ? "Alertas esenciales" : "Experiencia completa",
    badge: item.planCode === "basic" ? "MÁS ELEGIDO" : "MÁXIMO ACCESO",
    price: `${item.priceUsd?.toFixed(2)} USD / mes`,
    description: item.description,
    features: item.features,
    href: item.planCode === "basic" ? "/checkout?product=plan-basic" : "/checkout?product=plan-advanced",
    cta: item.planCode === "basic" ? "Comprar BASIC" : "Comprar PRO",
    tone: item.planCode === "basic" ? ("basic" as const) : ("pro" as const),
  })),
];

export default function PlansModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-[2px] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-[#D4AF37]/28 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_32%),linear-gradient(180deg,#0f0f0f_0%,#050505_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
            <div>
              <h3 className="text-xl font-bold text-white sm:text-2xl">Planes oficiales CARVIPIX</h3>
              <p className="mt-1 text-sm text-[#C7C0B4]">Modelo comercial vigente: FREE, BASIC y PRO</p>
            </div>
            <button
              aria-label="Cerrar"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37] transition duration-200 hover:bg-[#D4AF37]/16"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
            <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
              {OFFICIAL_PLANS.map((plan) => {
                const isFree = plan.tone === "free";
                const isBasic = plan.tone === "basic";
                const isPro = plan.tone === "pro";
                const Icon = isFree ? Shield : isPro ? Crown : Star;

                return (
                  <article
                    key={plan.title}
                    className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-5 sm:p-6 ${
                      isPro
                        ? "border-[#D4AF37]/50 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_38%),linear-gradient(180deg,#18110a_0%,#090909_100%)] shadow-[0_20px_50px_rgba(212,175,55,0.08)]"
                        : isBasic
                          ? "border-[#D4AF37]/22 bg-[linear-gradient(180deg,#121212_0%,#0a0a0a_100%)]"
                          : "border-white/10 bg-[linear-gradient(180deg,#121212_0%,#0a0a0a_100%)]"
                    }`}
                  >
                    <div className="flex min-h-[72px] items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${isFree ? "border-white/10 bg-white/5 text-white" : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
                          <Icon size={20} />
                        </span>
                        <div>
                          <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${isFree ? "text-white" : "text-[#D4AF37]"}`}>{plan.title}</p>
                          <p className="mt-1 text-sm text-[#C7C0B4]">{plan.subtitle}</p>
                        </div>
                      </div>
                      {plan.badge ? (
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${isPro ? "border border-[#D4AF37]/40 bg-[#D4AF37]/16 text-[#F4C542]" : "border border-[#D4AF37]/30 bg-[#D4AF37]/12 text-[#E9C96B]"}`}>
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-6 min-h-[90px]">
                      <p className={`text-4xl font-bold leading-none ${isFree ? "text-white" : "text-[#F4C542]"}`}>{plan.price}</p>
                      <p className="mt-3 text-sm text-[#A9A39B]">{plan.description}</p>
                    </div>

                    <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-[#ECE7DE]">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 leading-6">
                          <span className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isFree ? "border-white/10 bg-white/5 text-white/80" : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
                            <Check size={12} />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <Link
                        href={plan.href}
                        onClick={onClose}
                        style={isPro ? { color: "#000000", opacity: 1, fontWeight: 700 } : undefined}
                        className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition duration-200 ${
                          isPro
                            ? "bg-gradient-to-r from-[#D4AF37] to-[#F4C542] text-black hover:!text-black focus:!text-black active:!text-black shadow-[0_16px_40px_rgba(212,175,55,0.18)] hover:brightness-110"
                            : isBasic
                              ? "border border-[#D4AF37]/35 bg-[#17120a] text-[#F4C542] hover:bg-[#1e180d]"
                              : "border border-white/12 bg-[#151515] text-white hover:bg-[#1d1d1d]"
                        }`}
                      >
                        {isPro ? <span style={{ color: "#000000", opacity: 1, fontWeight: 700 }}>{plan.cta}</span> : plan.cta}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
