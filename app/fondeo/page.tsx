'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, DollarSign, Calendar, Building2, Zap } from 'lucide-react';
import { getFundingSnapshot } from '@/app/lib/client-data-helpers';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

export default function FondeoPage() {
  const [showModal, setShowModal] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  const [fundingData, setFundingData] = useState({ activePrograms: 0, approvedAccounts: 0, totalCapital: 0 });

  useEffect(() => {
    const loadFunding = async () => {
      try {
        const snapshot = await getFundingSnapshot();
        setFundingData({
          activePrograms: Number(snapshot.activePrograms ?? 0),
          approvedAccounts: Number(snapshot.approvedAccounts ?? 0),
          totalCapital: Number(snapshot.totalCapital ?? 0),
        });
      } catch {
        setFundingData({ activePrograms: 0, approvedAccounts: 0, totalCapital: 0 });
      }
    };

    loadFunding();
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B0B0B] to-[#030303] border-b border-white/5 px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#D4AF37]">
              Pase de cuenta fondeada
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-3xl">
              CARVIPIX gestiona el proceso para buscar una cuenta fondeada de alto capital con evaluación, seguimiento y control operativo.
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Pago único', variant: 'premium' as const },
                { label: 'FTMO / TopTier', variant: 'default' as const },
                { label: 'Capital objetivo 200K', variant: 'default' as const },
                { label: 'Gestión del proceso', variant: 'success' as const },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CARVIPIXBadge variant={badge.variant}>{badge.label}</CARVIPIXBadge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Service Card + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Main Service Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <CARVIPIXCard variant="premium" padding="24" hover={false}>
              <h2 className="text-2xl font-bold mb-2">Servicio completo</h2>
              <p className="text-3xl font-bold text-[#D4AF37] mb-2">
                {fundingData.totalCapital > 0 ? `${fundingData.totalCapital.toLocaleString()} USD` : 'Capital objetivo por confirmar'}
              </p>
              <p className="text-sm text-white/70 mb-6">Pago único por gestión del proceso</p>
              <CARVIPIXButton onClick={() => setShowModal(true)} variant="premium" fullWidth>
                Solicitar revisión
              </CARVIPIXButton>
            </CARVIPIXCard>
          </motion.div>

          {/* Metrics */}
          {[
            {
              label: 'Capital objetivo',
                value: fundingData.totalCapital > 0 ? `${fundingData.totalCapital.toLocaleString()} USD` : 'Definición en curso',
              icon: '💰',
            },
            {
              label: 'Cuentas aprobadas',
              value: fundingData.approvedAccounts > 0 ? String(fundingData.approvedAccounts) : '0',
              icon: '⏱️',
            },
            {
              label: 'Programas activos',
              value: fundingData.activePrograms > 0 ? String(fundingData.activePrograms) : '0',
              icon: '🏢',
            },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <CARVIPIXCard variant="statistics" padding="16" hover={false}>
                <p className="text-white/60 text-sm font-medium mb-3">{metric.label}</p>
                <p className="text-2xl font-bold text-white mb-2">{metric.value}</p>
                <p className="text-2xl">{metric.icon}</p>
              </CARVIPIXCard>
            </motion.div>
          ))}
        </div>

        {/* Qué incluye */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-8">Qué incluye</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Revisión inicial del perfil',
              'Selección de empresa compatible',
              'Análisis de reglas de la prueba',
              'Gestión y seguimiento del proceso',
              'Reporte de avance',
              'Entrega de credenciales al aprobar',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex gap-4"
              >
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-white/80">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Proceso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-8">Proceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Solicitas revisión', desc: 'Envías tu solicitud' },
              { step: '2', title: 'Seleccionamos empresa', desc: 'Compatible con tu perfil' },
              { step: '3', title: 'Confirmamos reglas', desc: 'Validamos condiciones' },
              { step: '4', title: 'Gestión de evaluación', desc: 'Seguimiento del proceso' },
              { step: '5', title: 'Entrega de credenciales', desc: 'Al aprobar la evaluación' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center"
              >
                <div className="bg-[#D4AF37] text-[#030303] rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Empresas Disponibles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-8">Empresas disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'FTMO', desc: 'Empresa de evaluación reconocida' },
              { name: 'TopTier Trader', desc: 'Empresa de evaluación reconocida' },
              { name: 'Otra empresa', desc: 'Disponible solo si sus políticas permiten gestión por terceros' },
            ].map((company, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  i < 2
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <h3 className="font-bold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-white/70">{company.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Resultado Esperado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4">Resultado esperado</h2>
          <p className="text-white/70 leading-relaxed">
            Al completar exitosamente la evaluación, el cliente recibe las credenciales de una cuenta fondeada para operar capital objetivo de hasta 200,000 USD, sujeto a reglas de la empresa seleccionada.
          </p>
        </motion.div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <CARVIPIXButton
            onClick={() => setShowModal(true)}
            variant="premium"
            fullWidth
          >
            Solicitar revisión
          </CARVIPIXButton>
          <CARVIPIXButton variant="secondary" fullWidth onClick={() => {
            termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}>
            Ver términos
          </CARVIPIXButton>
        </div>

        {/* Legal Footer */}
        <motion.div
          ref={termsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border-t border-white/10 pt-8 text-xs text-white/40"
        >
          <p className="leading-relaxed">
            <strong className="text-white/50">Nota importante:</strong> CARVIPIX no es empresa de fondeo ni garantiza aprobación. El servicio consiste en gestión y seguimiento del proceso de evaluación con empresas externas. La aprobación depende de las reglas, condiciones y desempeño requerido por la empresa seleccionada. Otras empresas se revisan únicamente si sus políticas permiten gestión por terceros.
          </p>
        </motion.div>
      </div>

      {/* Modal - Solicitar Revisión */}
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
            className="bg-[#0B0B0B] border border-white/20 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Solicitar revisión</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:border-[#D4AF37] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Empresa preferida</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none">
                  <option value="">Selecciona una opción</option>
                  <option>FTMO</option>
                  <option>TopTier Trader</option>
                  <option>Otra empresa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capital objetivo</label>
                <input
                  type="text"
                  value={fundingData.totalCapital > 0 ? `${fundingData.totalCapital.toLocaleString()} USD` : 'Se definirá al validar tu solicitud'}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 text-xs text-white/70">
              <p>✓ Esta solicitud requiere validación de datos.</p>
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
                  alert('✓ Solicitud de revisión enviada. Requiere validación completa.');
                }}
                variant="premium"
                fullWidth
              >
                Enviar solicitud
              </CARVIPIXButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
