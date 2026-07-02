'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, TrendingUp, Lock, Shield, RefreshCw, ArrowDown, ArrowUp, X, CheckCircle2 } from 'lucide-react';
import { getCapitalAccount, getCapitalMovements, getCapitalMonthlyReports } from '@/app/lib/data-helpers';

export default function GestionCapitalPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrollToMovements, setScrollToMovements] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);

  const [capitalAsignado, setCapitalAsignado] = useState(12500);
  const [balanceActual, setBalanceActual] = useState(13180);
  
  const ganancia = balanceActual - capitalAsignado;
  const rendimiento = ((ganancia / capitalAsignado) * 100).toFixed(2);

  // Load capital data from modules on mount
  useEffect(() => {
    const loadCapitalData = async () => {
      try {
        const account = await getCapitalAccount();
        const movements = await getCapitalMovements();
        
        if (account) {
          setCapitalAsignado(account.initialCapital);
          setBalanceActual(account.currentBalance);
        }
      } catch (error) {
        console.log("Usando datos demo de capital");
      }
    };

    loadCapitalData();
  }, []);

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
    { name: 'Tether USD', symbol: 'USDT', icon: '₮', network: 'TRC20/ERC20' },
    { name: 'USD Coin', symbol: 'USDC', icon: '₵', network: 'ERC20' },
    { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  ];

  return (
    <div className="min-h-screen bg-[#05070B] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B111A] to-[#05070B] border-b border-white/5 px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#D4AF37]">
              Gestión de Capital
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl">
              Asigna capital a una gestión privada con seguimiento visual, control de riesgo y reportes claros.
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Vista demo', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
                { label: 'Asignación en crypto', color: 'bg-blue-500/10 text-blue-400' },
                { label: 'Seguimiento privado', color: 'bg-purple-500/10 text-purple-400' },
                { label: 'Control de riesgo', color: 'bg-green-500/10 text-green-400' },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
                >
                  {badge.label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Metrics Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Capital asignado', value: `$${capitalAsignado.toLocaleString()}`, icon: '💰', color: 'from-blue-600/20 to-blue-400/5' },
            { label: 'Balance actual', value: `$${balanceActual.toLocaleString()}`, icon: '📊', color: 'from-purple-600/20 to-purple-400/5' },
            { label: 'Rendimiento demo', value: `+${rendimiento}%`, icon: '📈', color: 'from-green-600/20 to-green-400/5', highlight: true },
            { label: 'Estado', value: 'Gestión activa', icon: '✅', color: 'from-emerald-600/20 to-emerald-400/5' },
            { label: 'Riesgo operativo', value: 'Moderado', icon: '⚠️', color: 'from-orange-600/20 to-orange-400/5' },
            { label: 'Última actualización', value: 'hace 2 min', icon: '🕐', color: 'from-cyan-600/20 to-cyan-400/5' },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`bg-gradient-to-br ${metric.color} border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-white/20 transition-all`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium mb-2">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.highlight ? 'text-green-400' : 'text-white'}`}>
                    {metric.value}
                  </p>
                </div>
                <span className="text-2xl">{metric.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-xl font-bold mb-1">Evolución del Balance</h2>
          <p className="text-xs text-white/50 mb-6">Datos demo para vista previa</p>
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
                stroke="#D4AF37"
                dot={{ fill: '#D4AF37', r: 5 }}
                activeDot={{ r: 7 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cómo funciona */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-8">Cómo funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Solicita asignación', desc: 'Abre una solicitud de inversión' },
              { step: '2', title: 'Selecciona crypto', desc: 'Elige tu método de pago' },
              { step: '3', title: 'Confirma asignación', desc: 'Valida y confirma el depósito' },
              { step: '4', title: 'Gestión interna', desc: 'CARVIPIX aplica metodología' },
              { step: '5', title: 'Visualiza resultados', desc: 'Sigue balance y movimientos' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center"
              >
                <div className="bg-[#D4AF37] text-[#05070B] rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Crypto Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-6">Métodos de asignación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cryptoMethods.map((crypto, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                onClick={() => setSelectedCrypto(crypto.symbol)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCrypto === crypto.symbol
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 hover:border-white/30 bg-white/5'
                }`}
              >
                <div className="text-3xl mb-2">{crypto.icon}</div>
                <p className="font-bold">{crypto.name}</p>
                <p className="text-sm text-white/60">{crypto.symbol}</p>
                {crypto.network && <p className="text-xs text-[#D4AF37] mt-1">{crypto.network}</p>}
              </motion.button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 bg-[#D4AF37] text-[#05070B] font-bold py-3 px-6 rounded-xl hover:bg-[#E5C158] transition-all shadow-lg"
            >
              Solicitar asignación
            </button>
            <button
              onClick={() => setScrollToMovements(true)}
              className="flex-1 border border-[#D4AF37] text-[#D4AF37] font-bold py-3 px-6 rounded-xl hover:bg-[#D4AF37]/10 transition-all"
            >
              Ver movimientos
            </button>
          </div>
        </motion.div>

        {/* Movimientos Tabla */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-6">Historial de movimientos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Monto</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Método</th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="py-3 px-4">{mov.fecha}</td>
                    <td className="py-3 px-4">{mov.tipo}</td>
                    <td className={`py-3 px-4 font-medium ${mov.monto.includes('+') ? 'text-green-400' : mov.monto.includes('-') ? 'text-red-400' : 'text-white'}`}>
                      {mov.monto}
                    </td>
                    <td className="py-3 px-4 text-white/60">{mov.metodo}</td>
                    <td className="py-3 px-4">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                        {mov.estado}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Security & Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-6 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-6">Seguridad y confianza</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '🔒', title: 'Seguimiento privado del balance', desc: 'Acceso exclusivo a tu gestor y datos' },
              { icon: '📋', title: 'Reportes claros por período', desc: 'Información transparente y detallada' },
              { icon: '⚡', title: 'Control de exposición', desc: 'Límites definidos para cada operación' },
              { icon: '✅', title: 'Gestión disciplinada', desc: 'Metodología interna CARVIPIX probada' },
              { icon: '💬', title: 'Comunicación directa', desc: 'Equipo disponible para consultas' },
              { icon: '📊', title: 'Monitoreo operativo', desc: 'Supervisión constante del capital asignado' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.05 }}
                className="flex gap-4"
              >
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Nota sobre Metodología */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 backdrop-blur-sm"
        >
          <p className="text-white/70 leading-relaxed">
            <span className="font-semibold text-white">Cómo se gestiona tu capital:</span> El capital se gestiona mediante metodología interna CARVIPIX, monitoreo operativo y control de riesgo. Todo es supervisado por nuestro equipo especializado para mantener disciplina operativa.
          </p>
        </motion.div>

        {/* Legal Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="border-t border-white/10 pt-8 text-xs text-white/40"
        >
          <p className="leading-relaxed">
            <strong className="text-white/50">Vista demo.</strong> La gestión de capital implica riesgo y los resultados pueden variar. CARVIPIX no garantiza rendimientos específicos. Los servicios reales de asignación, custodia, pagos o gestión de fondos requieren términos publicados y validación legal previa. El usuario reconoce que el trading implica riesgo y que los resultados pasados no garantizan resultados futuros. CARVIPIX ofrece herramientas, contenido y servicios informativos/operativos bajo los términos publicados, sin garantizar rendimientos específicos.
          </p>
        </motion.div>
      </div>

      {/* Modal - Solicitar Asignación */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0B111A] border border-white/20 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Solicitar asignación</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Monto a asignar (USD)</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Criptomoneda</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none">
                  <option value="">Selecciona una opción</option>
                  <option>Bitcoin (BTC)</option>
                  <option>Tether (USDT TRC20)</option>
                  <option>Tether (USDT ERC20)</option>
                  <option>USD Coin (USDC)</option>
                  <option>Ethereum (ETH)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 text-xs text-white/70">
              <p>✓ Esto es una solicitud demo. En modo real, necesitarás confirmar términos y validación.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-white/20 text-white font-bold py-2 rounded-lg hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  alert('✓ Solicitud de asignación enviada (demo). En producción, requiere validación y términos de aceptación.');
                }}
                className="flex-1 bg-[#D4AF37] text-[#05070B] font-bold py-2 rounded-lg hover:bg-[#E5C158] transition"
              >
                Solicitar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
