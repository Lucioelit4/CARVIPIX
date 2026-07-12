'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, FileCheck2, Landmark, Scale, X, CircleCheckBig, LockKeyhole, BadgeCheck, BarChart3 } from 'lucide-react';
import { getCapitalAccount, getCapitalMovements, getCapitalMonthlyReports } from '@/app/lib/client-data-helpers';
import { CARVIPIXButton } from '@/app/design-system';
import type { CapitalMovement, MonthlyReport } from '@/app/lib/modules/capital/types';
import DataSourceBanner from '@/app/components/DataSourceBanner';

export default function GestionCapitalPage() {
  const [showModal, setShowModal] = useState(false);
  const [scrollToMovements, setScrollToMovements] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT');

  const [capitalAsignado, setCapitalAsignado] = useState(0);
  const [balanceActual, setBalanceActual] = useState(0);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [movimientos, setMovimientos] = useState<CapitalMovement[]>([]);
  const [fechaInicioGestion, setFechaInicioGestion] = useState<Date | null>(null);
  const movimientosRef = useRef<HTMLDivElement | null>(null);

  const ganancia = balanceActual - capitalAsignado;
  const rendimiento = capitalAsignado > 0 ? ((ganancia / capitalAsignado) * 100).toFixed(2) : "0.00";

  useEffect(() => {
    const loadCapitalData = async () => {
      try {
        const [account, movimientosData, reports] = await Promise.all([
          getCapitalAccount(),
          getCapitalMovements(),
          getCapitalMonthlyReports(),
        ]);

        if (account) {
          setCapitalAsignado(account.initialCapital);
          setBalanceActual(account.currentBalance);
          setFechaInicioGestion(new Date(account.fechaInicio));
        }

        setMovimientos(movimientosData);
        setMonthlyReports(reports);
      } catch {
        setCapitalAsignado(0);
        setBalanceActual(0);
        setFechaInicioGestion(null);
        setMovimientos([]);
        setMonthlyReports([]);
      }
    };

    loadCapitalData();
  }, []);

  useEffect(() => {
    if (scrollToMovements && movimientosRef.current) {
      movimientosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToMovements(false);
    }
  }, [scrollToMovements]);

  const mesesGestionados = useMemo(() => {
    if (!fechaInicioGestion) return 0;
    const now = new Date();
    const months = (now.getFullYear() - fechaInicioGestion.getFullYear()) * 12 + (now.getMonth() - fechaInicioGestion.getMonth());
    return Math.max(1, months + 1);
  }, [fechaInicioGestion]);

  const consistencia = useMemo(() => {
    if (monthlyReports.length === 0) return 0;
    const positivos = monthlyReports.filter((report) => report.rendimiento >= 0).length;
    return Math.round((positivos / monthlyReports.length) * 100);
  }, [monthlyReports]);

  const chartData = useMemo(() => {
    if (monthlyReports.length > 0) {
      return monthlyReports.map((report) => ({
        mes: report.mes,
        balance: Math.round(report.capitalFinal),
      }));
    }

    return [];
  }, [monthlyReports]);

  const resultadosRecientes = useMemo(() => {
    if (monthlyReports.length > 0) {
      return [...monthlyReports].slice(-6).reverse();
    }

    return [];
  }, [monthlyReports]);

  const movimientosTabla = useMemo(() => {
    if (movimientos.length > 0) {
      return movimientos.slice(0, 6);
    }

    return [];
  }, [movimientos]);

  const cryptoMethods = [
    { name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
    { name: 'Tether USD', symbol: 'USDT', icon: '₮', network: 'TRC20/ERC20' },
    { name: 'USD Coin', symbol: 'USDC', icon: '₵', network: 'ERC20' },
    { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6">
        <DataSourceBanner />
      </div>
      <div className="bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.14),transparent_36%),linear-gradient(180deg,#0B0B0B_0%,#030303_100%)]">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-16 sm:px-6 md:pt-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid items-stretch gap-8 rounded-[2rem] border border-[#2A2A2A] bg-[linear-gradient(180deg,#111111_0%,#0B0B0B_100%)] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] md:grid-cols-[1.05fr_0.95fr] md:p-10"
          >
            <div>
              <p className="mb-5 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Gestión patrimonial privada</p>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">Protegemos tu patrimonio.</h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#B5B5B5] md:text-lg">
                Gestión profesional enfocada en preservar y hacer crecer tu capital mediante estrategias disciplinadas,
                control de riesgo y procesos verificables.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: 'Preservación del capital' },
                  { icon: BadgeCheck, label: 'Estrategias probadas' },
                  { icon: Scale, label: 'Riesgo controlado' },
                  { icon: FileCheck2, label: 'Reportes transparentes' },
                ].map((pillar, index) => {
                  const Icon = pillar.icon;
                  return (
                    <motion.div
                      key={pillar.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                      className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#121212]/80 px-4 py-3"
                    >
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                      <span className="text-sm text-white/90">{pillar.label}</span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <CARVIPIXButton variant="premium" onClick={() => setShowModal(true)}>
                  Asignar capital
                </CARVIPIXButton>
                <CARVIPIXButton variant="secondary" onClick={() => setScrollToMovements(true)}>
                  Ver trazabilidad
                </CARVIPIXButton>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2A2A2A] bg-[linear-gradient(180deg,#121212_0%,#0F0F0F_100%)] p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#B5B5B5]">Rendimiento histórico</p>
                  <p className="mt-2 text-3xl font-semibold text-white md:text-4xl">{rendimiento}%</p>
                </div>
                <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                  Historico verificado
                </span>
              </div>

              <div className="h-[260px] rounded-2xl border border-white/5 bg-[#0B0B0B]/70 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="capitalArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF12" />
                    <XAxis dataKey="mes" tick={{ fill: '#8E8E8E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8E8E8E', fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
                    <Tooltip
                      formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Balance']}
                      contentStyle={{
                        backgroundColor: '#0B0B0B',
                        border: '1px solid #2A2A2A',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                      }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#D4AF37" strokeWidth={2.1} fill="url(#capitalArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#2A2A2A] bg-[#121212]/80 p-3">
                  <p className="text-xs text-white/55">Rentabilidad acumulada</p>
                  <p className="mt-1 text-xl font-semibold text-[#2ECC71]">
                    {ganancia > 0 ? '+' : ''}${ganancia.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2A2A2A] bg-[#121212]/80 p-3">
                  <p className="text-xs text-white/55">Tiempo gestionado</p>
                  <p className="mt-1 text-xl font-semibold text-white">{mesesGestionados} meses</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 md:pb-28">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="grid grid-cols-1 gap-5 pt-10 md:grid-cols-2 xl:grid-cols-3"
        >
          {[
            { label: 'Capital asignado', value: `$${capitalAsignado.toLocaleString()}`, icon: Landmark, positive: false },
            { label: 'Balance actual', value: `$${balanceActual.toLocaleString()}`, icon: BarChart3, positive: false },
            { label: 'Ganancia acumulada', value: `+$${ganancia.toLocaleString()}`, icon: CircleCheckBig, positive: true },
            { label: 'Nivel de riesgo', value: 'Controlado', icon: Scale, positive: false },
            { label: 'Tiempo gestionado', value: `${mesesGestionados} meses`, icon: LockKeyhole, positive: false },
            { label: 'Consistencia', value: `${consistencia}%`, icon: ShieldCheck, positive: true },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.05 }}
              className="rounded-2xl border border-[#2A2A2A] bg-[linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-6 shadow-[0_22px_72px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/50">{metric.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${metric.positive ? 'text-[#2ECC71]' : 'text-white'}`}>
                    {metric.value}
                  </p>
                </div>
                <metric.icon className="h-6 w-6 text-[#D4AF37]" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="mt-14 rounded-3xl border border-[#2A2A2A] bg-[linear-gradient(180deg,#111111_0%,#0B0B0B_100%)] p-7 md:p-10"
        >
          <h2 className="text-3xl font-semibold text-white">¿Por qué confiar en nuestra gestión?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              'Gestión profesional',
              'Estrategias validadas',
              'Protección del capital',
              'Reportes claros',
              'Crecimiento sostenible',
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <CircleCheckBig className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-sm text-white/90">{item}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              'Datos verificados',
              'Fondos segregados',
              'Gestión institucional',
              'Protección legal',
              'Reportes auditables',
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="rounded-2xl border border-[#2A2A2A] bg-[#121212]/75 p-4"
              >
                <p className="text-sm font-medium text-white">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="mt-14 rounded-3xl border border-[#2A2A2A] bg-[linear-gradient(180deg,#111111_0%,#0B0B0B_100%)] p-7 md:p-10"
        >
          <h2 className="text-3xl font-semibold text-white">Resultados recientes</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/65">
            Rendimientos mensuales de referencia presentados con criterios de transparencia institucional.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#121212] text-xs uppercase tracking-[0.14em] text-white/55">
                <tr>
                  <th className="px-5 py-4">Periodo</th>
                  <th className="px-5 py-4">Capital inicial</th>
                  <th className="px-5 py-4">Capital final</th>
                  <th className="px-5 py-4">Utilidad</th>
                  <th className="px-5 py-4">Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {resultadosRecientes.length === 0 ? (
                  <tr className="border-t border-white/5 bg-[#0F0F0F]/75">
                    <td className="px-5 py-6 text-white/65" colSpan={5}>Los reportes mensuales estarán disponibles al cerrar el primer periodo operativo.</td>
                  </tr>
                ) : (
                  resultadosRecientes.map((item, i) => (
                    <tr key={`${item.mes}-${i}`} className="border-t border-white/5 bg-[#0F0F0F]/75">
                      <td className="px-5 py-4 text-white/85">{item.mes}</td>
                      <td className="px-5 py-4 text-white/85">${Math.round(item.capitalInicial).toLocaleString()}</td>
                      <td className="px-5 py-4 text-white/85">${Math.round(item.capitalFinal).toLocaleString()}</td>
                      <td className={`px-5 py-4 font-medium ${item.utilidad >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                        {item.utilidad >= 0 ? '+' : ''}${Math.round(item.utilidad).toLocaleString()}
                      </td>
                      <td className={`px-5 py-4 font-medium ${item.rendimiento >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                        {item.rendimiento >= 0 ? '+' : ''}{item.rendimiento.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.div
          ref={movimientosRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.66 }}
          className="mt-14 rounded-3xl border border-[#2A2A2A] bg-[linear-gradient(180deg,#111111_0%,#0B0B0B_100%)] p-7 md:p-10"
        >
          <h2 className="text-2xl font-semibold text-white">Trazabilidad operativa</h2>
          <p className="mt-3 text-sm text-white/65">Detalle de movimientos y eventos asociados a la cuenta gestionada.</p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cryptoMethods.map((crypto, i) => (
              <motion.button
                key={crypto.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72 + i * 0.08 }}
                onClick={() => setSelectedCrypto(crypto.symbol)}
                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                  selectedCrypto === crypto.symbol
                    ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/30'
                }`}
              >
                <div className="mb-2 text-3xl">{crypto.icon}</div>
                <p className="font-semibold text-white">{crypto.name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/55">{crypto.symbol}</p>
                {crypto.network ? <p className="mt-1 text-xs text-[#D4AF37]">{crypto.network}</p> : null}
              </motion.button>
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-[#121212]">
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/50">
                  <th className="px-4 py-4 text-left font-medium">Fecha</th>
                  <th className="px-4 py-4 text-left font-medium">Tipo</th>
                  <th className="px-4 py-4 text-left font-medium">Detalle</th>
                  <th className="px-4 py-4 text-left font-medium">Monto</th>
                  <th className="px-4 py-4 text-left font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {movimientosTabla.length === 0 ? (
                  <tr className="border-b border-white/5 bg-[#0F0F0F]/75">
                    <td className="px-4 py-6 text-white/65" colSpan={5}>Aún no hay movimientos registrados. Inicia una asignación para habilitar trazabilidad.</td>
                  </tr>
                ) : (
                  movimientosTabla.map((mov, i) => (
                    <motion.tr
                      key={mov.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.84 + i * 0.05 }}
                      className="border-b border-white/5 bg-[#0F0F0F]/75"
                    >
                      <td className="px-4 py-3 text-white/80">{new Date(mov.fecha).toLocaleDateString('es-ES')}</td>
                      <td className="px-4 py-3 text-white/80 capitalize">{mov.type}</td>
                      <td className="px-4 py-3 text-white/65">{mov.description}</td>
                      <td className={`px-4 py-3 font-medium ${mov.amount >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                        {mov.amount >= 0 ? '+' : ''}${Math.abs(mov.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white/85">${mov.balanceAfter.toLocaleString()}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78 }}
          className="mt-14 rounded-[2rem] border border-[#D4AF37]/25 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.12),transparent_32%),linear-gradient(180deg,#121212_0%,#0B0B0B_100%)] p-7 md:p-12"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Propuesta de valor</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
            Invierte con inteligencia.
            <br />
            Descansa tranquilo.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
            Nos encargamos de gestionar tu patrimonio con disciplina, experiencia y una metodología enfocada en la
            preservación del capital y el crecimiento sostenible.
          </p>
          <div className="mt-8">
            <CARVIPIXButton variant="premium" onClick={() => setShowModal(true)}>
              Asignar capital
            </CARVIPIXButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 rounded-2xl border border-white/10 bg-[#0B0B0B] px-5 py-4 md:px-7 md:py-5"
        >
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">GARANTÍA CARVIPIX</p>
            <p className="max-w-3xl text-sm text-white/65 md:text-right">
              Nuestro compromiso es administrar el capital con disciplina, transparencia y control del riesgo.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 border-t border-white/10 pt-8 text-xs text-white/40">
          <p className="leading-relaxed">
            <strong className="text-white/50">Aviso.</strong> La gestión de capital implica riesgo y los resultados pueden variar.
            CARVIPIX no garantiza rendimientos específicos. Los servicios reales de asignación, custodia, pagos o gestión
            de fondos requieren términos publicados y validación legal previa.
          </p>
        </motion.div>
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/20 bg-[#0B0B0B] p-8"
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
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
                  value={selectedCrypto}
                  onChange={(event) => setSelectedCrypto(event.target.value)}
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="USDT">Tether (USDT TRC20/ERC20)</option>
                  <option value="USDC">USD Coin (USDC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 text-xs text-white/70">
              <p>✓ Esta solicitud requiere confirmar términos y validación.</p>
            </div>

            <div className="flex gap-3">
              <CARVIPIXButton
                onClick={() => setShowModal(false)}
                variant="ghost"
                fullWidth
              >
                Cancelar
              </CARVIPIXButton>
              <CARVIPIXButton
                onClick={() => {
                  setShowModal(false);
                  alert('✓ Solicitud de asignación enviada. Requiere validación y términos de aceptación.');
                }}
                variant="premium"
                fullWidth
              >
                Solicitar
              </CARVIPIXButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
