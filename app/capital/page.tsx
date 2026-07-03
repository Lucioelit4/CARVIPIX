'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, TrendingUp, Lock, Shield, RefreshCw, ArrowDown, ArrowUp, X, CheckCircle2, FileText, ShieldCheck, Activity, MessageCircle, BarChart3 } from 'lucide-react';
import { CARVIPIXCard, CARVIPIXButton, colors, spacing, typography, borders, shadows } from '../design-system';

export default function CapitalPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrollToMovements, setScrollToMovements] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);

  const capitalAsignado = 12500;
  const balanceActual = 13180;
  const ganancia = balanceActual - capitalAsignado;
  const rendimiento = ((ganancia / capitalAsignado) * 100).toFixed(2);

  const chartData = [
    { mes: 'Día 1', balance: 12500 },
    { mes: 'Día 4', balance: 12650 },
    { mes: 'Día 7', balance: 12800 },
    { mes: 'Día 10', balance: 12950 },
    { mes: 'Día 13', balance: 13050 },
    { mes: 'Día 16', balance: 13120 },
    { mes: 'Día 19', balance: 13180 },
  ];

  const movimientos = [
    { fecha: '2026-07-01', tipo: 'Asignación inicial', monto: '10,000 USDT', metodo: 'TRC20', estado: 'Confirmado' },
    { fecha: '2026-06-28', tipo: 'Rendimiento actualizado', monto: '+$320 USD', metodo: 'Demo', estado: 'Procesado' },
    { fecha: '2026-06-25', tipo: 'Ajuste de balance', monto: '-$85 USD', metodo: 'Mercado', estado: 'Ejecutado' },
    { fecha: '2026-06-22', tipo: 'Solicitud de reporte', monto: '-', metodo: 'Sistema', estado: 'Procesado' },
  ];

  const cryptoMethods = [
    { name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
    { name: 'Tether USD', symbol: 'USDT', icon: '₮', network: 'TRC20' },
    { name: 'Tether USD', symbol: 'USDT', icon: '₮', network: 'ERC20' },
    { name: 'USD Coin', symbol: 'USDC', icon: '₵', network: 'ERC20' },
  ];

  return (
    <main style={{ minHeight: '100vh', backgroundColor: colors.black.pure, color: colors.white.pure }}>
      {/* Hero Section */}
      <div style={{ background: `linear-gradient(to bottom, rgba(11, 17, 26, 1), rgba(5, 7, 11, 1))`, borderBottom: `1px solid rgba(255, 255, 255, 0.05)`, paddingLeft: spacing[24], paddingRight: spacing[24], paddingTop: spacing[48], paddingBottom: spacing[48] }}>
        <div style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '80rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ fontSize: '2.25rem', fontWeight: typography.weights.bold, marginBottom: spacing[16], color: colors.gold.primary }}>
              Gestión de Capital
            </h1>
            <p style={{ fontSize: typography.sizes.lg, color: `rgba(255, 255, 255, 0.7)`, marginBottom: spacing[32], maxWidth: '42rem' }}>
              Asigna capital a una gestión privada con seguimiento visual, control de riesgo y reportes claros.
            </p>
            
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[12] }}>
              {[
                { label: 'Vista demo', color: colors.gold.primary, bgColor: `rgba(212, 175, 55, 0.1)` },
                { label: 'Asignación en crypto', color: `rgba(255, 255, 255, 0.7)`, bgColor: `rgba(255, 255, 255, 0.05)` },
                { label: 'Seguimiento privado', color: `rgba(255, 255, 255, 0.7)`, bgColor: `rgba(255, 255, 255, 0.05)` },
                { label: 'Control de riesgo', color: '#86EFAC', bgColor: `rgba(34, 197, 94, 0.1)` },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    paddingLeft: spacing[12],
                    paddingRight: spacing[12],
                    paddingTop: spacing[4],
                    paddingBottom: spacing[4],
                    borderRadius: '9999px',
                    fontSize: typography.sizes.xs,
                    fontWeight: typography.weights.medium,
                    color: badge.color,
                    backgroundColor: badge.bgColor,
                  }}
                >
                  {badge.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '80rem', paddingLeft: spacing[24], paddingRight: spacing[24], paddingTop: spacing[48] }}>
        {/* Metrics Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[16], marginBottom: spacing[32] }}
        >
          {[
            { label: 'Capital asignado', value: `$${capitalAsignado.toLocaleString()}`, icon: '💰', highlight: false },
            { label: 'Balance actual', value: `$${balanceActual.toLocaleString()}`, icon: '📊', highlight: false },
            { label: 'Rendimiento demo', value: `+${rendimiento}%`, icon: '📈', highlight: true },
            { label: 'Estado', value: 'Gestión activa', icon: '✅', highlight: false },
            { label: 'Riesgo operativo', value: 'Moderado', icon: '⚠️', highlight: false },
            { label: 'Última actualización', value: 'hace 2 min', icon: '🕐', highlight: false },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              style={{
                background: metric.highlight ? `rgba(34, 197, 94, 0.1)` : `rgba(255, 255, 255, 0.05)`,
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: borders.radius.xl,
                padding: spacing[16],
                backdropFilter: 'blur(1px)',
                transition: 'all 200ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255, 255, 255, 0.2)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: `rgba(255, 255, 255, 0.6)`, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: spacing[8] }}>{metric.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: typography.weights.bold, color: metric.highlight ? '#86EFAC' : colors.white.pure }}>
                    {metric.value}
                  </p>
                </div>
                <span style={{ fontSize: '1.5rem' }}>{metric.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CARVIPIXCard variant="elevated" padding="24">
            <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing[4] }}>Evolución del Balance</h2>
            <p style={{ fontSize: typography.sizes.xs, color: `rgba(255, 255, 255, 0.5)`, marginBottom: spacing[24] }}>Datos demo para vista previa</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="mes" stroke="#ffffff40" style={{ fontSize: '12px' }} />
                <YAxis stroke="#ffffff40" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B111A',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={colors.gold.primary}
                  dot={{ fill: colors.gold.primary, r: 5 }}
                  activeDot={{ r: 7 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CARVIPIXCard>
        </motion.div>

        {/* Cómo funciona */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: spacing[32] }}
        >
          <CARVIPIXCard variant="elevated" padding="24">
            <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing[32] }}>Cómo funciona</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: spacing[16] }}>
              {[
                { step: '1', title: 'Solicita asignación', desc: 'Abre una solicitud de asignación' },
                { step: '2', title: 'Selecciona crypto', desc: 'Elige tu método de asignación' },
                { step: '3', title: 'Confirma asignación', desc: 'Valida y confirma el depósito' },
                { step: '4', title: 'Gestión interna', desc: 'CARVIPIX aplica metodología' },
                { step: '5', title: 'Visualiza resultados', desc: 'Sigue balance y movimientos' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ backgroundColor: colors.gold.primary, color: colors.black.pure, borderRadius: '9999px', width: spacing[48], height: spacing[48], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: typography.weights.bold, fontSize: typography.sizes.lg, margin: '0 auto', marginBottom: spacing[12] }}>
                    {item.step}
                  </div>
                  <h3 style={{ fontWeight: typography.weights.semibold, marginBottom: spacing[4] }}>{item.title}</h3>
                  <p style={{ fontSize: typography.sizes.sm, color: `rgba(255, 255, 255, 0.6)` }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </CARVIPIXCard>
        </motion.div>

        {/* Crypto Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: spacing[32] }}
        >
          <CARVIPIXCard variant="elevated" padding="24">
            <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing[24] }}>Métodos de asignación</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing[16], marginBottom: spacing[24] }}>
              {cryptoMethods.map((crypto, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                  style={{
                    padding: spacing[16],
                    borderRadius: borders.radius.lg,
                    border: `2px solid ${selectedCrypto === crypto.symbol ? colors.gold.primary : 'rgba(255, 255, 255, 0.1)'}`,
                    backgroundColor: selectedCrypto === crypto.symbol ? `rgba(212, 175, 55, 0.1)` : `rgba(255, 255, 255, 0.05)`,
                    transition: 'all 200ms ease',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: colors.white.pure,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCrypto !== crypto.symbol) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCrypto !== crypto.symbol) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.875rem', marginBottom: spacing[8] }}>{crypto.icon}</div>
                  <p style={{ fontWeight: typography.weights.bold }}>{crypto.name}</p>
                  <p style={{ fontSize: typography.sizes.sm, color: colors.white.secondary }}>{crypto.symbol}</p>
                  {crypto.network && <p style={{ fontSize: typography.sizes.xs, color: colors.gold.primary, marginTop: spacing[4] }}>{crypto.network}</p>}
                </motion.button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[12], justifyContent: 'flex-start' }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.gold.primary,
                  color: colors.black.pure,
                  fontWeight: typography.weights.bold,
                  paddingTop: spacing[12],
                  paddingBottom: spacing[12],
                  paddingLeft: spacing[24],
                  paddingRight: spacing[24],
                  borderRadius: borders.radius.lg,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  boxShadow: shadows.glow.md,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E5C158';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.gold.primary;
                }}
              >
                Solicitar asignación
              </button>
              <button
                onClick={() => setScrollToMovements(true)}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.gold.primary}`,
                  color: colors.gold.primary,
                  fontWeight: typography.weights.bold,
                  paddingTop: spacing[12],
                  paddingBottom: spacing[12],
                  paddingLeft: spacing[24],
                  paddingRight: spacing[24],
                  borderRadius: borders.radius.lg,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgba(212, 175, 55, 0.1)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                Ver movimientos
              </button>
            </div>
          </CARVIPIXCard>
        </motion.div>

        {/* Movimientos Tabla */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: spacing[32] }}
        >
          <CARVIPIXCard variant="elevated" padding="24">
            <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing[24] }}>Historial de movimientos</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: typography.sizes.sm, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.1)` }}>
                    <th style={{ textAlign: 'left', paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)`, fontWeight: typography.weights.medium }}>Fecha</th>
                    <th style={{ textAlign: 'left', paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)`, fontWeight: typography.weights.medium }}>Tipo</th>
                    <th style={{ textAlign: 'left', paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)`, fontWeight: typography.weights.medium }}>Monto</th>
                    <th style={{ textAlign: 'left', paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)`, fontWeight: typography.weights.medium }}>Método</th>
                    <th style={{ textAlign: 'left', paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)`, fontWeight: typography.weights.medium }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)`, transition: 'all 200ms ease' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16] }}>{mov.fecha}</td>
                      <td style={{ paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16] }}>{mov.tipo}</td>
                      <td style={{ paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], fontWeight: typography.weights.medium, color: mov.monto.includes('+') ? '#86EFAC' : mov.monto.includes('-') ? '#F87171' : colors.white.pure }}>
                        {mov.monto}
                      </td>
                      <td style={{ paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16], color: `rgba(255, 255, 255, 0.6)` }}>{mov.metodo}</td>
                      <td style={{ paddingTop: spacing[12], paddingBottom: spacing[12], paddingLeft: spacing[16], paddingRight: spacing[16] }}>
                        <span style={{ backgroundColor: `rgba(34, 197, 94, 0.2)`, color: '#86EFAC', paddingLeft: spacing[8], paddingRight: spacing[8], paddingTop: spacing[4], paddingBottom: spacing[4], borderRadius: borders.radius.md, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium }}>
                          {mov.estado}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CARVIPIXCard>
        </motion.div>

        {/* Security & Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: spacing[32] }}
        >
          <CARVIPIXCard variant="elevated" padding="24">
            <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing[24] }}>Seguridad y confianza</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing[24] }}>
              {[
                { icon: Lock, title: 'Seguimiento privado del balance', desc: 'Acceso exclusivo a tu gestor y datos' },
                { icon: FileText, title: 'Reportes claros por período', desc: 'Información transparente y detallada' },
                { icon: ShieldCheck, title: 'Control de exposición', desc: 'Límites definidos para cada operación' },
                { icon: Activity, title: 'Gestión disciplinada', desc: 'Metodología interna CARVIPIX supervisada' },
                { icon: MessageCircle, title: 'Comunicación directa', desc: 'Equipo disponible para consultas' },
                { icon: BarChart3, title: 'Monitoreo operativo', desc: 'Supervisión constante del capital asignado' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.05 }}
                  style={{ display: 'flex', gap: spacing[16] }}
                >
                  <item.icon style={{ width: spacing[24], height: spacing[24], color: colors.gold.primary, flexShrink: 0, marginTop: spacing[4] }} />
                  <div>
                    <h3 style={{ fontWeight: typography.weights.bold, marginBottom: spacing[4] }}>{item.title}</h3>
                    <p style={{ fontSize: typography.sizes.sm, color: `rgba(255, 255, 255, 0.6)` }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CARVIPIXCard>
        </motion.div>

        {/* Nota sobre Metodología */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: spacing[32] }}
        >
          <div style={{ backgroundColor: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(255, 255, 255, 0.1)`, borderRadius: borders.radius.xl, padding: spacing[24], backdropFilter: 'blur(1px)' }}>
            <p style={{ color: `rgba(255, 255, 255, 0.7)`, lineHeight: 1.7 }}>
              <span style={{ fontWeight: typography.weights.semibold, color: colors.white.pure }}>Cómo se gestiona tu capital:</span> El capital se gestiona mediante metodología interna CARVIPIX, monitoreo operativo y control de riesgo. Todo es supervisado por nuestro equipo especializado para mantener disciplina operativa.
            </p>
          </div>
        </motion.div>

        {/* Legal Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ marginTop: spacing[32], marginBottom: spacing[48], borderTop: `1px solid rgba(255, 255, 255, 0.1)`, paddingTop: spacing[32], fontSize: typography.sizes.xs, color: `rgba(255, 255, 255, 0.4)` }}
        >
          <p style={{ lineHeight: 1.7 }}>
            <strong style={{ color: `rgba(255, 255, 255, 0.5)` }}>Vista demo.</strong> La gestión de capital implica riesgo y los resultados pueden variar. CARVIPIX no garantiza rendimientos específicos. Los servicios reales de asignación, custodia, pagos o gestión de fondos requieren términos publicados y validación legal previa.
          </p>
        </motion.div>
      </div>

      {/* Modal - Solicitar Asignación */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: spacing[16],
            paddingRight: spacing[16],
            zIndex: 50,
          }}
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              backgroundColor: `rgba(11, 17, 26, 1)`,
              border: `1px solid rgba(255, 255, 255, 0.2)`,
              borderRadius: borders.radius.xl,
              padding: spacing[32],
              maxWidth: '28rem',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[24] }}>
              <h2 style={{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>Solicitar asignación</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  color: `rgba(255, 255, 255, 0.6)`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing[8],
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = colors.white.pure;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = `rgba(255, 255, 255, 0.6)`;
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], marginBottom: spacing[24] }}>
              <div>
                <label style={{ display: 'block', fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: spacing[8] }}>Monto a asignar (USD)</label>
                <input
                  type="number"
                  placeholder="5000"
                  style={{
                    width: '100%',
                    backgroundColor: `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    borderRadius: borders.radius.lg,
                    paddingLeft: spacing[16],
                    paddingRight: spacing[16],
                    paddingTop: spacing[8],
                    paddingBottom: spacing[8],
                    color: colors.white.pure,
                    fontSize: typography.sizes.base,
                    outline: 'none',
                    transition: 'all 200ms ease',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = colors.gold.primary;
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: spacing[8] }}>Criptomoneda</label>
                <select
                  style={{
                    width: '100%',
                    backgroundColor: `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    borderRadius: borders.radius.lg,
                    paddingLeft: spacing[16],
                    paddingRight: spacing[16],
                    paddingTop: spacing[8],
                    paddingBottom: spacing[8],
                    color: colors.white.pure,
                    fontSize: typography.sizes.base,
                    outline: 'none',
                    transition: 'all 200ms ease',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLSelectElement).style.borderColor = colors.gold.primary;
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLSelectElement).style.borderColor = `rgba(255, 255, 255, 0.1)`;
                  }}
                >
                  <option value="">Selecciona una opción</option>
                  <option>Bitcoin (BTC)</option>
                  <option>Tether (USDT TRC20)</option>
                  <option>Tether (USDT ERC20)</option>
                  <option>USD Coin (USDC)</option>
                  <option>Ethereum (ETH)</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: `rgba(234, 179, 8, 0.1)`, border: `1px solid rgba(234, 179, 8, 0.3)`, borderRadius: borders.radius.lg, paddingLeft: spacing[12], paddingRight: spacing[12], paddingTop: spacing[12], paddingBottom: spacing[12], marginBottom: spacing[24], fontSize: typography.sizes.xs, color: `rgba(255, 255, 255, 0.7)` }}>
              <p>✓ Esto es una solicitud demo. En modo real, necesitarás confirmar términos y validación.</p>
            </div>

            <div style={{ display: 'flex', gap: spacing[12] }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  border: `1px solid rgba(255, 255, 255, 0.2)`,
                  color: colors.white.pure,
                  fontWeight: typography.weights.bold,
                  paddingTop: spacing[8],
                  paddingBottom: spacing[8],
                  borderRadius: borders.radius.lg,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `rgba(255, 255, 255, 0.05)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  alert('✓ Solicitud de asignación enviada (demo). En producción, requiere validación y términos de aceptación.');
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.gold.primary,
                  color: colors.black.pure,
                  fontWeight: typography.weights.bold,
                  paddingTop: spacing[8],
                  paddingBottom: spacing[8],
                  borderRadius: borders.radius.lg,
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
                Solicitar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
