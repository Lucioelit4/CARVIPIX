"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PlansModal({ open, onClose }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleSubscribe = (plan: string) => {
    if (!accepted) return;
    setSubmitting(true);
    setMessage("");
    // Simulate async submission
    setTimeout(() => {
      setSubmitting(false);
      setMessage("Solicitud de plan registrada en modo demo");
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B1220]/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Planes CARVIPIX</h3>
            <p className="mt-1 text-sm text-slate-400">Selecciona el plan que prefieras. (Simulación)</p>
          </div>
          <button
            aria-label="Cerrar"
            onClick={() => { setMessage(""); setAccepted(false); onClose(); }}
            className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10"
          >
            <X />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#10141D]/90 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">Plan Starter</p>
                <p className="mt-2 text-3xl font-bold">14.99 USD</p>
                <p className="mt-1 text-xs text-zinc-400">IVA incluido. Total aprox: 17.99 USD</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Demo</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>Alertas limitadas</li>
              <li>Acceso a pares principales</li>
              <li>Calendario económico</li>
              <li>Historial básico</li>
              <li>Soporte estándar</li>
            </ul>

            <div className="mt-4">
              <button
                onClick={() => handleSubscribe("starter")}
                disabled={!accepted || submitting}
                className={`w-full rounded-full px-4 py-2 font-semibold text-black transition ${
                  accepted ? "bg-[#D4AF37] hover:bg-[#f5d76e]" : "bg-white/5 cursor-not-allowed"
                }`}
              >
                {submitting ? "Enviando..." : "Contratar Starter"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#10141D]/90 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">Plan Elite</p>
                <p className="mt-2 text-3xl font-bold">150 USD</p>
                <p className="mt-1 text-xs text-zinc-400">Membresía avanzada para traders con mayor cobertura operativa.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Demo</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>Más alertas</li>
              <li>Alertas prioritarias</li>
              <li>Acceso a señales premium</li>
              <li>Más pares y mercados</li>
              <li>Análisis extendido y seguimiento avanzado</li>
              <li>Soporte preferente</li>
            </ul>

            <div className="mt-4">
              <button
                onClick={() => handleSubscribe("elite")}
                disabled={!accepted || submitting}
                className={`w-full rounded-full px-4 py-2 font-semibold text-black transition ${
                  accepted ? "bg-[#D4AF37] hover:bg-[#f5d76e]" : "bg-white/5 cursor-not-allowed"
                }`}
              >
                {submitting ? "Enviando..." : "Contratar Elite"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-[#0B1220]/80 p-4 text-sm text-slate-300">
          <p className="mb-3">Términos y condiciones</p>
          <p className="text-xs text-zinc-400">
            Las señales compartidas por CARVIPIX tienen fines educativos e informativos. El usuario reconoce que operar mercados financieros implica riesgo y que los resultados pasados no garantizan resultados futuros.
          </p>

          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-black/20"
            />
            <span className="text-sm text-slate-300">Acepto términos y condiciones</span>
          </label>

          {message && (
            <div className="mt-4 rounded-md bg-green-800/30 p-3 text-sm text-green-200">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
