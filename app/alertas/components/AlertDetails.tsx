"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { CARVIPIXCard, CARVIPIXButton, colors, spacing, typography, borders } from "../../design-system";

interface AlertDetailsProps {
  alert?: {
    id: string;
    symbol: string;
    market: string;
    tipo: string;
    entrada: string;
    sl: string;
    tp: string;
    rr: string;
    estado: string;
    hora: string;
    session?: string;
    risk: string;
    probability?: string;
    analysis?: string;
    plan?: string;
    direction: string;
  };
}

const defaultAlert = {
  id: "default",
  symbol: "XAUUSD",
  market: "Oro",
  tipo: "Compra",
  entrada: "2338.45",
  sl: "2332.00",
  tp: "2345.00",
  rr: "2.31",
  estado: "Activa",
  hora: "14:32",
  risk: "Medio",
  direction: "Compra",
};

export default function AlertDetails({ alert = defaultAlert }: AlertDetailsProps) {
  const [copied, setCopied] = useState(false);

  const copyAlert = async () => {
    const text = `${alert.symbol} ${alert.tipo} | Entrada ${alert.entrada} | SL ${alert.sl} | TP ${alert.tp} | RR ${alert.rr}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <CARVIPIXCard variant="elevated" padding="16">
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: typography.sizes.sm, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.white.secondary }}>Señal de Trading</p>
            <h2 style={{ marginTop: spacing[12], fontSize: '1.875rem', fontWeight: typography.weights.semibold, color: colors.white.pure }}>{alert.symbol}</h2>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>
              {alert.tipo} • {alert.market}
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing[8] }}>
            <span style={{ display: 'inline-flex', minWidth: 'max-content', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', borderRadius: '9999px', paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, backgroundColor: alert.estado.includes("Activa") ? `rgba(34, 197, 94, 0.1)` : `rgba(255, 255, 255, 0.05)`, color: alert.estado.includes("Activa") ? '#86EFAC' : colors.white.secondary }}>
              {alert.estado}
            </span>
          </div>
        </div>

        <div style={{ marginTop: spacing[24], overflow: 'hidden', borderRadius: borders.radius.lg, border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(11, 17, 27, 0.95)`, padding: spacing[16] }}>
          <div style={{ position: 'relative', height: '176px', overflow: 'hidden', borderRadius: borders.radius.lg, background: `linear-gradient(135deg, rgba(7, 16, 24, 1) 0%, rgba(10, 16, 30, 1) 50%, rgba(16, 20, 36, 1) 100%)`, padding: spacing[16] }}>
            <div style={{ position: 'absolute', left: spacing[32], right: spacing[32], top: spacing[32], height: '1px', backgroundColor: `rgba(255, 255, 255, 0.1)` }} />
            <div style={{ position: 'absolute', left: spacing[32], right: spacing[32], top: spacing[80], height: '1px', backgroundColor: `rgba(212, 175, 55, 0.2)` }} />

            <div style={{ position: 'absolute', left: spacing[40], top: spacing[48], display: 'flex', alignItems: 'center', gap: spacing[8], borderRadius: '9999px', backgroundColor: `rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.white.secondary }}>
              <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: colors.gold.primary }} /> Entrada
            </div>
            <div style={{ position: 'absolute', right: spacing[40], top: spacing[80], display: 'flex', alignItems: 'center', gap: spacing[8], borderRadius: '9999px', backgroundColor: `rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.white.secondary }}>
              <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} /> TP
            </div>
            <div style={{ position: 'absolute', right: spacing[40], bottom: spacing[16], display: 'flex', alignItems: 'center', gap: spacing[8], borderRadius: '9999px', backgroundColor: `rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[4], paddingBottom: spacing[4], fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.24em', color: colors.white.secondary }}>
              <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#F87171' }} /> SL
            </div>

            <div style={{ position: 'absolute', inset: 0, bottom: spacing[16], display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: spacing[32], paddingRight: spacing[32], fontSize: typography.sizes.xs, color: colors.white.secondary }}>
              <span>Señal validada por CARVIPIX</span>
              <span style={{ borderRadius: '9999px', border: `1px solid rgba(255, 255, 255, 0.1)`, backgroundColor: `rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[8], paddingRight: spacing[8], paddingTop: spacing[4], paddingBottom: spacing[4] }}>Datos en vivo</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: spacing[16], display: 'grid', gap: spacing[8], gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
          <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(12, 17, 24, 0.9)`, padding: spacing[12], minWidth: 0 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: colors.white.secondary }}>Entrada</p>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.white.pure, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.entrada}</p>
          </div>
          <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(12, 17, 24, 0.9)`, padding: spacing[12], minWidth: 0 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: colors.white.secondary }}>Stop Loss</p>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: '#F87171', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.sl}</p>
          </div>
          <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(12, 17, 24, 0.9)`, padding: spacing[12], minWidth: 0 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: colors.white.secondary }}>Take Profit</p>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: '#86EFAC', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.tp}</p>
          </div>
          <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(12, 17, 24, 0.9)`, padding: spacing[12], minWidth: 0 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: colors.white.secondary }}>Riesgo/Beneficio</p>
            <p style={{ marginTop: spacing[8], fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold.primary, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{alert.rr}</p>
          </div>
        </div>

        <div style={{ marginTop: spacing[24], borderRadius: borders.radius.lg, border: `1px solid rgba(212, 175, 55, 0.2)`, backgroundColor: `rgba(13, 18, 26, 0.95)`, padding: spacing[16] }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.gold.primary }}>Información de Riesgo</h3>
              <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: colors.white.secondary }}>Nivel de riesgo de esta operación</p>
            </div>
          </div>

          <div style={{ marginTop: spacing[16], display: 'grid', gap: spacing[12], gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(16, 21, 30, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Nivel de Riesgo</p>
              <p style={{ marginTop: spacing[8], color: colors.white.pure, fontWeight: typography.weights.semibold }}>{alert.risk}</p>
            </div>
            <div style={{ borderRadius: borders.radius.lg, backgroundColor: `rgba(16, 21, 30, 0.9)`, padding: spacing[16] }}>
              <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.2em', color: colors.white.secondary }}>Hora de la Señal</p>
              <p style={{ marginTop: spacing[8], color: colors.white.pure, fontWeight: typography.weights.semibold }}>{alert.hora}</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: spacing[24], borderRadius: borders.radius.lg, border: `1px solid rgba(34, 197, 94, 0.2)`, backgroundColor: `rgba(34, 197, 94, 0.1)`, padding: spacing[16] }}>
          <p style={{ fontSize: typography.sizes.sm, color: '#86EFAC', fontWeight: typography.weights.semibold }}>✓ Señal validada por CARVIPIX</p>
          <p style={{ marginTop: spacing[8], fontSize: typography.sizes.sm, color: `rgba(134, 239, 172, 0.8)` }}>Esta señal ha sido analizada y validada por nuestro sistema de análisis. Recuerda gestionar tu riesgo adecuadamente.</p>
        </div>

        <div style={{ marginTop: spacing[24] }}>
          <button
            type="button"
            onClick={copyAlert}
            style={{
              width: '100%',
              borderRadius: borders.radius.lg,
              backgroundColor: colors.gold.primary,
              paddingLeft: spacing[12],
              paddingRight: spacing[12],
              paddingTop: spacing[8],
              paddingBottom: spacing[8],
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              color: colors.black.pure,
              transition: 'all 200ms ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[8],
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#F5D76E';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = colors.gold.primary;
            }}
          >
            <Copy size={16} /> {copied ? "Copiado" : "Copiar Señal"}
          </button>
        </div>
      </CARVIPIXCard>
    </motion.div>
  );
}
