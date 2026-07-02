'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Zap, Clock } from 'lucide-react';

export default function HerramientasPage() {
  const [activeTab, setActiveTab] = useState('riesgo');

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
              Herramientas de trading
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl">
              Calculadoras y utilidades para apoyar tu análisis operativo con cálculos aproximados y referencias de mercado.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tool Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { id: 'riesgo', title: 'Calculadora de riesgo', icon: Calculator, desc: 'Riesgo USD y tamaño' },
            { id: 'rr', title: 'Calculadora RR', icon: TrendingUp, desc: 'Relación riesgo/beneficio' },
            { id: 'pips', title: 'Conversor de pips', icon: Zap, desc: 'Pips y lotaje' },
            { id: 'sesiones', title: 'Sesiones de mercado', icon: Clock, desc: 'Horarios activos' },
          ].map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveTab(tool.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  activeTab === tool.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${activeTab === tool.id ? 'text-[#D4AF37]' : 'text-white/60'}`} />
                <p className="font-bold text-sm">{tool.title}</p>
                <p className="text-xs text-white/60 mt-1">{tool.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Tool Panels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={activeTab}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
        >
          {activeTab === 'riesgo' && <CalculadoraRiesgo />}
          {activeTab === 'rr' && <CalculadoraRR />}
          {activeTab === 'pips' && <ConversorPips />}
          {activeTab === 'sesiones' && <SesionesMercado />}
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40">
          <p>Vista demo. Estas herramientas son de apoyo operativo y usan cálculos aproximados.</p>
        </div>
      </div>
    </div>
  );
}

function CalculadoraRiesgo() {
  const [capital, setCapital] = useState(10000);
  const [riesgoPct, setRiesgoPct] = useState(2);
  const [stopLossPips, setStopLossPips] = useState(50);
  const [valorPorPip, setValorPorPip] = useState(10);

  const riesgoUSD = (capital * riesgoPct) / 100;
  const tamano = valorPorPip > 0 && stopLossPips > 0 ? (riesgoUSD / (stopLossPips * valorPorPip)).toFixed(2) : '0.00';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Calculadora de riesgo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Capital de la cuenta (USD)</label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Riesgo (%)</label>
          <input
            type="number"
            step="0.1"
            value={riesgoPct}
            onChange={(e) => setRiesgoPct(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Stop Loss (pips/puntos)</label>
          <input
            type="number"
            value={stopLossPips}
            onChange={(e) => setStopLossPips(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Valor por pip (USD)</label>
          <input
            type="number"
            step="0.01"
            value={valorPorPip}
            onChange={(e) => setValorPorPip(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Riesgo en USD</p>
          <p className="text-3xl font-bold text-[#D4AF37]">${riesgoUSD.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Tamaño sugerido (lotes)</p>
          <p className="text-3xl font-bold text-green-400">{tamano}</p>
        </div>
      </div>
    </div>
  );
}

function CalculadoraRR() {
  const [tipo, setTipo] = useState('compra');
  const [entrada, setEntrada] = useState(1.0500);
  const [stopLoss, setStopLoss] = useState(1.0450);
  const [takeProfitValue, setTakeProfitValue] = useState(1.0600);

  const riesgo = Math.abs(tipo === 'compra' ? entrada - stopLoss : stopLoss - entrada);
  const beneficio = Math.abs(tipo === 'compra' ? takeProfitValue - entrada : entrada - takeProfitValue);
  const rr = riesgo > 0 ? (beneficio / riesgo).toFixed(2) : '0.00';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Calculadora RR (Riesgo/Recompensa)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Tipo de operación</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          >
            <option value="compra">Compra (Long)</option>
            <option value="venta">Venta (Short)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Entrada</label>
          <input
            type="number"
            step="0.0001"
            value={entrada}
            onChange={(e) => setEntrada(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Stop Loss</label>
          <input
            type="number"
            step="0.0001"
            value={stopLoss}
            onChange={(e) => setStopLoss(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Take Profit</label>
          <input
            type="number"
            step="0.0001"
            value={takeProfitValue}
            onChange={(e) => setTakeProfitValue(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Riesgo</p>
          <p className="text-2xl font-bold text-red-400">{riesgo.toFixed(4)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Beneficio potencial</p>
          <p className="text-2xl font-bold text-green-400">{beneficio.toFixed(4)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Relación RR</p>
          <p className="text-2xl font-bold text-[#D4AF37]">1:{rr}</p>
        </div>
      </div>
    </div>
  );
}

function ConversorPips() {
  const [activo, setActivo] = useState('forex');
  const [precioInicial, setPrecioInicial] = useState(1.0500);
  const [precioFinal, setPrecioFinal] = useState(1.0550);
  const [lote, setLote] = useState(1.0);

  const diferencia = Math.abs(precioFinal - precioInicial);
  let pips = 0;
  if (activo === 'forex') pips = diferencia * 10000;
  else if (activo === 'oro') pips = diferencia * 10;
  else if (activo === 'crypto') pips = diferencia;

  const ganancia = activo === 'forex' ? pips * lote * 10 : activo === 'oro' ? pips * lote * 100 : pips * lote * 1000;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Conversor de pips / lotaje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Activo</label>
          <select
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          >
            <option value="forex">Forex</option>
            <option value="oro">Oro</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Precio inicial</label>
          <input
            type="number"
            step="0.0001"
            value={precioInicial}
            onChange={(e) => setPrecioInicial(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Precio final</label>
          <input
            type="number"
            step="0.0001"
            value={precioFinal}
            onChange={(e) => setPrecioFinal(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Tamaño de lote</label>
          <input
            type="number"
            step="0.1"
            value={lote}
            onChange={(e) => setLote(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Diferencia (pips/puntos)</p>
          <p className="text-3xl font-bold text-[#D4AF37]">{pips.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Ganancia aproximada (USD)</p>
          <p className="text-3xl font-bold text-green-400">${ganancia.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function SesionesMercado() {
  const [horaLocal, setHoraLocal] = useState('');

  useEffect(() => {
    const updateHora = () => {
      const now = new Date();
      setHoraLocal(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateHora();
    const interval = setInterval(updateHora, 60000);
    return () => clearInterval(interval);
  }, []);

  const parseHora = (hh: string) => parseInt(hh, 10);
  const horaNumero = horaLocal ? parseHora(horaLocal.split(':')[0]) : 0;

  const sesiones = [
    { nombre: 'Asia', inicio: 18, fin: 3, descripcion: '18:00 a 03:00 (Siguiente día)' },
    { nombre: 'Londres', inicio: 2, fin: 11, descripcion: '02:00 a 11:00' },
    { nombre: 'Nueva York', inicio: 7, fin: 16, descripcion: '07:00 a 16:00' },
    { nombre: 'Solape Londres/NY', inicio: 7, fin: 11, descripcion: '07:00 a 11:00' },
  ];

  const getEstado = (inicio: number, fin: number) => {
    if (inicio <= fin) {
      return horaNumero >= inicio && horaNumero < fin ? 'Abierta' : 'Cerrada';
    } else {
      return horaNumero >= inicio || horaNumero < fin ? 'Abierta' : 'Cerrada';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Sesiones de mercado</h2>
      <p className="text-white/60 text-sm mb-6">Hora local: {horaLocal || 'Cargando...'}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sesiones.map((sesion, i) => {
          const estado = getEstado(sesion.inicio, sesion.fin);
          const isOpen = estado === 'Abierta';

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-lg border-2 ${
                isOpen
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{sesion.nombre}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isOpen
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {estado}
                </span>
              </div>
              <p className="text-white/70 text-sm">{sesion.descripcion}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
