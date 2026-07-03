"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Rocket, HelpCircle, ShieldCheck, TrendingUp } from "lucide-react";
import { getBotInstances, getBotLicense } from "@/app/lib/data-helpers";
import { CARVIPIXCard, CARVIPIXButton, colors, spacing, typography, borders, shadows } from "@/app/design-system";

export default function BotPage() {
  const [buying, setBuying] = useState(false);
  const [demoMetrics, setDemoMetrics] = useState({
    rendimiento: "+12.8%",
    operaciones: 64,
    winrate: "71%",
    drawdown: "5.4%",
    estado: "Bot activo",
    seguridad: "Gestión por reglas",
  });

  // Load bot data from modules on mount
  useEffect(() => {
    const loadBotData = async () => {
      try {
        const license = await getBotLicense();
        const instances = await getBotInstances();

        if (license && instances && instances.length > 0) {
          const firstInstance = instances[0];
          setDemoMetrics({
            rendimiento: `+${firstInstance.stats.profitLoss.toFixed(1)} USD`,
            operaciones: firstInstance.stats.totalTrades,
            winrate: `${(firstInstance.stats.winRate * 100).toFixed(1)}%`,
            drawdown: "5.4%",
            estado: "Bot activo",
            seguridad: "Gestión por reglas",
          });
        }
      } catch (error) {
        console.log("Usando datos demo del bot");
      }
    };

    loadBotData();
  }, []);

  const buy = () => {
    setBuying(true);
    setTimeout(() => setBuying(false), 2000);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: colors.black.pure, color: colors.white.pure, paddingLeft: spacing[24], paddingRight: spacing[24], paddingTop: spacing[32], paddingBottom: spacing[32] }}>
      <div style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '80rem' }}>
        {/* Hero Section */}
        <section style={{ marginBottom: spacing[32], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[24], alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: typography.sizes.xs, letterSpacing: '0.18em', textTransform: 'uppercase', color: `rgba(212, 175, 55, 0.8)`, marginBottom: spacing[8] }}>Producto</p>
            <h1 style={{ marginTop: spacing[8], fontSize: '2.25rem', fontWeight: typography.weights.bold }}>Bot CARVIPIX PRO</h1>
            <p style={{ marginTop: spacing[12], fontSize: typography.sizes.lg, color: colors.white.secondary, maxWidth: '42rem' }}>
              Automatización de trading para MT4/MT5 diseñada para operar bajo reglas, gestión de riesgo y seguimiento continuo.
            </p>
            <p style={{ marginTop: spacing[12], fontSize: typography.sizes.sm, color: `rgba(255, 255, 255, 0.5)` }}>El bot trabaja en automático. Tú no tienes que estar pegado a la pantalla.</p>

            {/* Badges */}
            <div style={{ marginTop: spacing[16], display: 'flex', flexWrap: 'wrap', gap: spacing[8], alignItems: 'center' }}>
              {[
                { label: 'Pago único: 999 USD', color: colors.gold.primary, bgColor: 'transparent', textColor: colors.black.pure },
                { label: 'MT4 / MT5', color: colors.white.secondary, bgColor: `rgba(255, 255, 255, 0.05)`, textColor: colors.white.secondary },
                { label: 'Modo demo', color: colors.white.secondary, bgColor: `rgba(255, 255, 255, 0.05)`, textColor: colors.white.secondary },
                { label: 'Actualizaciones Elite', color: colors.white.secondary, bgColor: `rgba(255, 255, 255, 0.05)`, textColor: colors.white.secondary },
              ].map((badge, i) => (
                <span
                  key={i}
                  style={{
                    borderRadius: '9999px',
                    paddingLeft: spacing[12],
                    paddingRight: spacing[12],
                    paddingTop: spacing[4],
                    paddingBottom: spacing[4],
                    fontSize: typography.sizes.xs,
                    fontWeight: typography.weights.semibold,
                    backgroundColor: badge.bgColor === 'transparent' ? colors.gold.primary : badge.bgColor,
                    color: badge.textColor,
                    border: badge.bgColor === 'transparent' ? 'none' : `1px solid rgba(255, 255, 255, 0.1)`,
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ marginTop: spacing[24], display: 'flex', gap: spacing[16], alignItems: 'center' }}>
              <button
                onClick={buy}
                style={{
                  borderRadius: borders.radius.lg,
                  backgroundColor: colors.gold.primary,
                  paddingLeft: spacing[16],
                  paddingRight: spacing[16],
                  paddingTop: spacing[12],
                  paddingBottom: spacing[12],
                  fontWeight: typography.weights.bold,
                  color: colors.black.pure,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: shadows.glow.md,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5C158';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gold.primary;
                }}
              >
                {buying ? 'Procesando...' : 'Comprar Bot CARVIPIX'}
              </button>
              <button
                style={{
                  borderRadius: borders.radius.lg,
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  paddingLeft: spacing[16],
                  paddingRight: spacing[16],
                  paddingTop: spacing[12],
                  paddingBottom: spacing[12],
                  fontSize: typography.sizes.sm,
                  color: colors.white.secondary,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgba(255, 255, 255, 0.05)`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(255, 255, 255, 0.2)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                }}
              >
                Ver demo
              </button>
            </div>
          </div>

          {/* Demo Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CARVIPIXCard variant="elevated" padding="16">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                  <Cpu style={{ color: colors.gold.primary }} size={24} />
                  <div>
                    <p style={{ fontSize: typography.sizes.sm, color: colors.white.secondary }}>Sistema automático monitoreando oportunidades</p>
                    <p style={{ fontSize: typography.sizes.xs, color: `rgba(255, 255, 255, 0.4)` }}>Interfaz demostrativa</p>
                  </div>
                </div>
                <div style={{ fontSize: typography.sizes.xs, color: colors.white.secondary }}>Estado: <span style={{ fontWeight: typography.weights.bold, color: colors.white.pure }}>{demoMetrics.estado}</span></div>
              </div>

              <div style={{ marginTop: spacing[16], display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[12] }}>
                {[
                  { label: 'Rendimiento demo', value: demoMetrics.rendimiento, isHighlight: true },
                  { label: 'Operaciones ejecutadas', value: demoMetrics.operaciones, isHighlight: false },
                  { label: 'Win Rate demo', value: demoMetrics.winrate, isHighlight: false },
                  { label: 'Drawdown demo', value: demoMetrics.drawdown, isHighlight: false },
                ].map((metric, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: borders.radius.lg,
                      backgroundColor: `rgba(11, 17, 26, 1)`,
                      paddingLeft: spacing[12],
                      paddingRight: spacing[12],
                      paddingTop: spacing[12],
                      paddingBottom: spacing[12],
                    }}
                  >
                    <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary }}>{metric.label}</p>
                    <p style={{ marginTop: spacing[4], fontSize: '1.5rem', fontWeight: typography.weights.bold, color: metric.isHighlight ? colors.gold.primary : colors.white.pure }}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: spacing[12], fontSize: typography.sizes.xs, color: colors.white.secondary }}>Resultados simulados para vista previa. Los datos reales se conectarán al bot oficial.</p>
            </CARVIPIXCard>
          </motion.div>
        </section>

        {/* Content Sections */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr', gap: spacing[24] }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
            {/* Cómo funciona */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Cómo funciona</h3>
                <ol style={{ marginTop: spacing[12], listStyle: 'decimal', paddingLeft: spacing[16], fontSize: typography.sizes.sm, color: colors.white.secondary, display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                  <li>Instalación en MT4/MT5.</li>
                  <li>Configuración del riesgo.</li>
                  <li>El bot analiza oportunidades según reglas.</li>
                  <li>Ejecuta operaciones automáticamente.</li>
                  <li>Registra resultados para seguimiento.</li>
                </ol>
              </CARVIPIXCard>
            </motion.div>

            {/* Beneficios */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Beneficios</h3>
                <ul style={{ marginTop: spacing[12], fontSize: typography.sizes.sm, color: colors.white.secondary, display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                  <li>Opera sin intervención constante.</li>
                  <li>Gestión de riesgo integrada.</li>
                  <li>Compatible con MT4/MT5.</li>
                  <li>Configuración profesional y seguimiento de rendimiento.</li>
                  <li>Actualizaciones para miembros Elite.</li>
                </ul>
              </CARVIPIXCard>
            </motion.div>

            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Preguntas frecuentes</h3>
                <div style={{ marginTop: spacing[12], fontSize: typography.sizes.sm, color: colors.white.secondary, display: 'flex', flexDirection: 'column', gap: spacing[12] }}>
                  {[
                    { q: '¿Funciona en MT4 o MT5?', a: 'Compatible con ambas plataformas.' },
                    { q: '¿Necesito tener experiencia?', a: 'Se recomienda conocimientos básicos; el bot automatiza la operativa pero requiere supervisión.' },
                    { q: '¿Incluye actualizaciones?', a: 'Miembros Elite reciben mejoras y actualizaciones continuas.' },
                    { q: '¿Garantiza ganancias?', a: 'No. El bot está diseñado para buscar oportunidades con gestión de riesgo, pero operar mercados financieros implica riesgo.' },
                  ].map((faq, i) => (
                    <div key={i}>
                      <p style={{ fontWeight: typography.weights.bold, color: colors.white.pure }}>{faq.q}</p>
                      <p style={{ fontSize: typography.sizes.xs, color: colors.white.secondary, marginTop: spacing[4] }}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CARVIPIXCard>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
            {/* Precio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>Precio</h3>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>Bot CARVIPIX PRO</p>
                <p style={{ marginTop: spacing[12], fontSize: '1.875rem', fontWeight: typography.weights.bold, color: colors.gold.primary }}>999 USD</p>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.xs, color: colors.white.secondary }}>Pago único. El bot se paga por separado aunque tengas membresía Elite.</p>
                <button
                  onClick={buy}
                  style={{
                    width: '100%',
                    marginTop: spacing[16],
                    borderRadius: borders.radius.lg,
                    backgroundColor: colors.gold.primary,
                    paddingLeft: spacing[16],
                    paddingRight: spacing[16],
                    paddingTop: spacing[12],
                    paddingBottom: spacing[12],
                    fontWeight: typography.weights.bold,
                    color: colors.black.pure,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5C158';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gold.primary;
                  }}
                >
                  Comprar Bot CARVIPIX
                </button>
              </CARVIPIXCard>
            </motion.div>

            {/* Actualizaciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.gold.primary }}>Actualizaciones</h3>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>Miembros Elite reciben nuevas actualizaciones y mejoras continuas. Usuarios sin membresía conservan la versión fija adquirida.</p>
                <p style={{ marginTop: spacing[12], fontSize: typography.sizes.xs, color: colors.white.secondary }}>Próxima actualización estimada: 2 meses</p>
              </CARVIPIXCard>
            </motion.div>

            {/* Seguridad */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <CARVIPIXCard variant="elevated" padding="16">
                <h3 style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.gold.primary }}>Seguridad</h3>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>{demoMetrics.seguridad}</p>
                <p style={{ marginTop: spacing[8], fontSize: typography.sizes.xs, color: colors.white.secondary }}>No se prometen resultados. Usa gestión de riesgo adecuada.</p>
              </CARVIPIXCard>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}

