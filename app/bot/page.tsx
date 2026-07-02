"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Rocket, HelpCircle, ShieldCheck, TrendingUp } from "lucide-react";

export default function BotPage() {
  const [buying, setBuying] = useState(false);

  const demoMetrics = {
    rendimiento: "+12.8%",
    operaciones: 64,
    winrate: "71%",
    drawdown: "5.4%",
    estado: "Bot activo",
    seguridad: "Gestión por reglas",
  };

  const buy = () => {
    setBuying(true);
    setTimeout(() => setBuying(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#05070B] text-white px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 grid gap-6 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]/80">Producto</p>
            <h1 className="mt-2 text-4xl font-bold">Bot CARVIPIX PRO</h1>
            <p className="mt-3 text-lg text-zinc-300 max-w-2xl">
              Automatización de trading para MT4/MT5 diseñada para operar bajo reglas, gestión de riesgo y seguimiento continuo.
            </p>
            <p className="mt-3 text-sm text-zinc-400">El bot trabaja en automático. Tú no tienes que estar pegado a la pantalla.</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-black text-xs font-semibold">Pago único: 999 USD</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">MT4 / MT5</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">Modo demo</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">Actualizaciones Elite</span>
            </div>

            <div className="mt-6 flex gap-4 items-center">
              <button onClick={buy} className="rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-black shadow">
                {buying ? "Procesando..." : "Comprar Bot CARVIPIX"}
              </button>
              <button className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">Ver demo</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="text-[#D4AF37]" />
                <div>
                  <p className="text-sm text-zinc-400">Sistema automático monitoreando oportunidades</p>
                  <p className="text-xs text-zinc-500">Interfaz demostrativa</p>
                </div>
              </div>
              <div className="text-xs text-zinc-400">Estado: <span className="font-semibold text-white">{demoMetrics.estado}</span></div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gradient-to-br from-[#071018] to-[#0B1220] p-3">
                <p className="text-xs text-zinc-400">Rendimiento demo</p>
                <p className="mt-1 text-2xl font-bold text-[#D4AF37]">{demoMetrics.rendimiento}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[#071018] to-[#0B1220] p-3">
                <p className="text-xs text-zinc-400">Operaciones ejecutadas</p>
                <p className="mt-1 text-2xl font-bold">{demoMetrics.operaciones}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[#071018] to-[#0B1220] p-3">
                <p className="text-xs text-zinc-400">Win Rate demo</p>
                <p className="mt-1 text-2xl font-bold">{demoMetrics.winrate}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-[#071018] to-[#0B1220] p-3">
                <p className="text-xs text-zinc-400">Drawdown demo</p>
                <p className="mt-1 text-2xl font-bold">{demoMetrics.drawdown}</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400">Resultados simulados para vista previa. Los datos reales se conectarán al bot oficial.</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div>
            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-lg font-semibold">Cómo funciona</h3>
              <ol className="mt-3 list-decimal pl-5 text-sm text-zinc-300 space-y-2">
                <li>Instalación en MT4/MT5.</li>
                <li>Configuración del riesgo.</li>
                <li>El bot analiza oportunidades según reglas.</li>
                <li>Ejecuta operaciones automáticamente.</li>
                <li>Registra resultados para seguimiento.</li>
              </ol>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-lg font-semibold">Beneficios</h3>
              <ul className="mt-3 text-sm text-zinc-300 space-y-2">
                <li>Opera sin intervención constante.</li>
                <li>Gestión de riesgo integrada.</li>
                <li>Compatible con MT4/MT5.</li>
                <li>Configuración profesional y seguimiento de rendimiento.</li>
                <li>Actualizaciones para miembros Elite.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-lg font-semibold">Preguntas frecuentes</h3>
              <div className="mt-3 text-sm text-zinc-300 space-y-3">
                <div>
                  <p className="font-semibold">¿Funciona en MT4 o MT5?</p>
                  <p className="text-xs text-zinc-400 mt-1">Compatible con ambas plataformas.</p>
                </div>
                <div>
                  <p className="font-semibold">¿Necesito tener experiencia?</p>
                  <p className="text-xs text-zinc-400 mt-1">Se recomienda conocimientos básicos; el bot automatiza la operativa pero requiere supervisión.</p>
                </div>
                <div>
                  <p className="font-semibold">¿Incluye actualizaciones?</p>
                  <p className="text-xs text-zinc-400 mt-1">Miembros Elite reciben mejoras y actualizaciones continuas.</p>
                </div>
                <div>
                  <p className="font-semibold">¿Garantiza ganancias?</p>
                  <p className="text-xs text-zinc-400 mt-1">No. El bot está diseñado para buscar oportunidades con gestión de riesgo, pero operar mercados financieros implica riesgo.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-lg font-semibold">Precio</h3>
              <p className="mt-2 text-sm text-zinc-300">Bot CARVIPIX PRO</p>
              <p className="mt-3 text-3xl font-bold text-[#D4AF37]">999 USD</p>
              <p className="mt-2 text-xs text-zinc-400">Pago único. El bot se paga por separado aunque tengas membresía Elite.</p>
              <div className="mt-4">
                <button onClick={buy} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-black">Comprar Bot CARVIPIX</button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Actualizaciones</h3>
              <p className="mt-2 text-sm text-zinc-300">Miembros Elite reciben nuevas actualizaciones y mejoras continuas. Usuarios sin membresía conservan la versión fija adquirida.</p>
              <p className="mt-3 text-xs text-zinc-400">Próxima actualización estimada: 2 meses</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Seguridad</h3>
              <p className="mt-2 text-sm text-zinc-300">{demoMetrics.seguridad}</p>
              <p className="mt-2 text-xs text-zinc-400">No se prometen resultados. Usa gestión de riesgo adecuada.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
// Removed duplicated legacy content — file contains only the new BotPage implementation above.
