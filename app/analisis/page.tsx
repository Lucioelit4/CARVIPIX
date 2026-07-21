/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Search, X, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { motion } from "framer-motion";
import DisclaimerNote from "@/app/components/DisclaimerNote";
import { CommunityAnalysisFeed } from "./CommunityAnalysisFeed";

export default function AnalisisPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [resultFilter, setResultFilter] = useState("Todos");
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const analyses = useMemo(() => {
    return [
      {
        id: 1,
        symbol: "XAUUSD",
        title: "Oro: Soporte en 2380",
        date: "2026-07-02",
        session: "Asiática",
        type: "Ruptura alcista",
        category: "Oro",
        status: "Ganada",
        result: "+2.4%",
        summary: "Entrada en ruptura del soporte, objetivo alcanzado.",
        risk: "Bajo",
        scenario: "Precio probó soporte de 2380 USD/oz con rechazo. Patrones de vela confirmaron reversión. Entrada en cierre de vela de ruptura.",
        entry: "2385 USD/oz",
        sl: "2375 USD/oz",
        tp: "2405 USD/oz",
        learning: "Confirmar ruptura con volumen y patrones de vela antes de entrar. La gestión de riesgo es crítica en metales.",
        finalStatus: "Objetivo alcanzado. Cerrado con +2.4% de ganancia.",
      },
      {
        id: 2,
        symbol: "EURUSD",
        title: "Euro: Reversión en media móvil",
        date: "2026-07-01",
        session: "Europea",
        type: "Reversión",
        category: "Forex",
        status: "Ganada",
        result: "+1.8%",
        summary: "Reversión en media móvil de 50 períodos, cierre en objetivo.",
        risk: "Medio",
        scenario: "EURUSD rebotó en la media móvil de 50 períodos (1.0850). Señales RSI muestran sobreventa. Patrón de martillo confirmó reversión.",
        entry: "1.0855",
        sl: "1.0835",
        tp: "1.0900",
        learning: "Las medias móviles son soporte/resistencia dinámico fuerte. Combinar con indicadores para confirmar entrada.",
        finalStatus: "Cierre con ganancias después de 4 horas.",
      },
      {
        id: 3,
        symbol: "BTCUSD",
        title: "Bitcoin: Ruptura alcista",
        date: "2026-06-30",
        session: "Global",
        type: "Tendencia",
        category: "Crypto",
        status: "Ganada",
        result: "+5.8%",
        summary: "Reversión tras noticia macro positiva, objetivo superado.",
        risk: "Alto",
        scenario: "Bitcoin rompió nivel de resistencia de 67,500 USD tras noticia de aprobación regulatoria. Volumen confirmó ruptura alcista fuerte.",
        entry: "67,650 USD",
        sl: "67,200 USD",
        tp: "68,500 USD",
        learning: "Las noticias macro mueven volumen. Esperar confirmación en vela de ruptura. El crypto es volátil, requiere SL ajustado.",
        finalStatus: "Superó objetivo. +5.8% de ganancia realizada.",
      },
      {
        id: 4,
        symbol: "GBPUSD",
        title: "Libra: Falsa ruptura, recuperación",
        date: "2026-06-29",
        session: "Londinense",
        type: "Scalping",
        category: "Forex",
        status: "Perdida",
        result: "-1.2%",
        summary: "Stop alcanzado tras alta volatilidad y retracción inesperada.",
        risk: "Medio",
        scenario: "GBPUSD mostró ruptura falsa de 1.2750. Volatilidad inesperada cerró la operación antes de objetivo. Gestión de riesgo evitó pérdidas mayores.",
        entry: "1.2760",
        sl: "1.2740",
        tp: "1.2800",
        learning: "Las falsas rupturas son comunes en sesiones de baja volatilidad. Usar confirmación adicional. El SL protege contra sorpresas.",
        finalStatus: "Stop ejecutado. Pérdida de -1.2% gestionada correctamente.",
      },
      {
        id: 5,
        symbol: "BTCUSD",
        title: "Bitcoin: Consolidación en 66k",
        date: "2026-06-28",
        session: "Global",
        type: "Rango",
        category: "Crypto",
        status: "En seguimiento",
        result: "±0%",
        summary: "Operación en consolidación, esperando ruptura.",
        risk: "Bajo",
        scenario: "Bitcoin consolida entre 65,800 y 67,200 USD. Bandas de Bollinger se estrechan. Patrón de triángulo ascendente en desarrollo.",
        entry: "66,500 USD",
        sl: "65,500 USD",
        tp: "68,000 USD",
        learning: "La consolidación precede a volatilidad. Prepara niveles de ruptura. Paciencia es crítica en rangos.",
        finalStatus: "En seguimiento. Esperando ruptura hacia cualquier dirección.",
      },
      {
        id: 6,
        symbol: "XAUUSD",
        title: "Oro: Soporte débil, rebote parcial",
        date: "2026-06-27",
        session: "Asiática",
        type: "Rebote",
        category: "Oro",
        status: "Ganada",
        result: "+1.5%",
        summary: "Rebote en soporte de 2370, cierre parcial de posición.",
        risk: "Medio",
        scenario: "XAUUSD tocó 2370 USD/oz (soporte clave). Rechazo de vela doji confirmó compra. Rebote alcanzó 2390.",
        entry: "2375 USD/oz",
        sl: "2360 USD/oz",
        tp: "2400 USD/oz",
        learning: "El oro respeta niveles clave de soporte. Los dojis en soportes = reversión probable. Parcializar ganancias en trayectos fuertes.",
        finalStatus: "Cierre parcial con +1.5% después de 5 horas.",
      },
      {
        id: 7,
        symbol: "EURUSD",
        title: "Euro: Caída tras datos de inflación",
        date: "2026-06-26",
        session: "Europea",
        type: "Macro",
        category: "Forex",
        status: "Ganada",
        result: "+2.1%",
        summary: "Operación direccional corta tras datos macro negativo.",
        risk: "Medio",
        scenario: "Datos de inflación europeos decepcionaron. EURUSD cayó desde 1.0920 a 1.0850. Entrada en quiebre de nivel de soporte.",
        entry: "1.0900",
        sl: "1.0930",
        tp: "1.0820",
        learning: "El calendario macro mueve mercados. Operar después de confirmación. Las operaciones de noticias requieren SL muy ajustado.",
        finalStatus: "+2.1% realizado en operación corta.",
      },
      {
        id: 8,
        symbol: "USDJPY",
        title: "Dólar-Yen: Resistencia en 157",
        date: "2026-06-25",
        session: "Global",
        type: "Resistencia",
        category: "Forex",
        status: "Perdida",
        result: "-0.8%",
        summary: "Rechazo en resistencia, operación cerrada con SL.",
        risk: "Bajo",
        scenario: "USDJPY alcanzó 157.50 (resistencia histórica) pero fue rechazado. Cierre de posición por gestión de riesgo.",
        entry: "157.20",
        sl: "157.80",
        tp: "158.50",
        learning: "Las resistencias fuertes son difíciles de romper. Confirmar ruptura con cierre por encima. El rechazo = señal de venta.",
        finalStatus: "Stop ejecutado. Gestión de riesgo evitó pérdidas mayores.",
      },
      {
        id: 9,
        symbol: "BTCUSD",
        title: "Bitcoin: Tendencia alcista confirmada",
        date: "2026-06-24",
        session: "Global",
        type: "Tendencia",
        category: "Crypto",
        status: "Ganada",
        result: "+3.2%",
        summary: "Continuación de tendencia alcista en Bitcoin.",
        risk: "Medio",
        scenario: "Bitcoin rompió resistencia de 66,000 USD con volumen alto. Confirmó tendencia alcista de largo plazo.",
        entry: "66,100 USD",
        sl: "65,500 USD",
        tp: "67,500 USD",
        learning: "Las rupturas con volumen son más confiables. Seguir tendencia establecida. Los stops protegen capital.",
        finalStatus: "+3.2% de ganancia en operación de tendencia.",
      },
      {
        id: 10,
        symbol: "XAUUSD",
        title: "Oro: Cobertura defensiva",
        date: "2026-06-23",
        session: "Asiática",
        type: "Cobertura",
        category: "Oro",
        status: "En seguimiento",
        result: "±0.5%",
        summary: "Posición de cobertura en consolidación de riesgo.",
        risk: "Bajo",
        scenario: "Oro se mantiene en rango defensivo. Actúa como cobertura contra incertidumbre macro. Consolidación esperada.",
        entry: "2380 USD/oz",
        sl: "2370 USD/oz",
        tp: "2420 USD/oz",
        learning: "El oro es activo defensivo. Usado para cobertura. Requiere paciencia en consolidaciones.",
        finalStatus: "Posición activa. Monitoreo continuo.",
      },
      {
        id: 11,
        symbol: "GBPUSD",
        title: "Libra: Reversión en nivel clave",
        date: "2026-06-22",
        session: "Londinense",
        type: "Reversión",
        category: "Forex",
        status: "Ganada",
        result: "+1.9%",
        summary: "Reversión en nivel de Fibonacci 0.618.",
        risk: "Medio",
        scenario: "GBPUSD retrocedió a nivel de Fibonacci 0.618 (1.2680). Confirmó compra con patrón de vela alcista.",
        entry: "1.2695",
        sl: "1.2650",
        tp: "1.2800",
        learning: "Los niveles de Fibonacci son soportes/resistencias. Combinarlos con patrones de vela mejora probabilidades.",
        finalStatus: "+1.9% de ganancia realizada.",
      },
      {
        id: 12,
        symbol: "EURUSD",
        title: "Euro: Congestión antes de BCE",
        date: "2026-06-21",
        session: "Europea",
        type: "Espera",
        category: "Forex",
        status: "En seguimiento",
        result: "±0%",
        summary: "Consolidación previa a reunión del BCE.",
        risk: "Bajo",
        scenario: "EURUSD en congestión. Reunión del BCE en 48 horas. Volatilidad baja. Esperando ruptura post-decisión.",
        entry: "1.0870",
        sl: "1.0850",
        tp: "1.0920",
        learning: "Eventos macro generan volatilidad. Esperar confirmación post-evento. La paciencia antes de noticias evita sorpresas.",
        finalStatus: "En espera de evento. Operación abierta.",
      },
    ];
  }, []);

  // Filtrar análisis
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((analysis) => {
      const matchesSearch =
        analysis.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.session.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "Todos" || analysis.category === categoryFilter;
      const matchesResult =
        resultFilter === "Todos" ||
        (resultFilter === "Ganadas" && analysis.status === "Ganada") ||
        (resultFilter === "Perdidas" && analysis.status === "Perdida") ||
        (resultFilter === "En seguimiento" && analysis.status === "En seguimiento");

      return matchesSearch && matchesCategory && matchesResult;
    });
  }, [searchTerm, categoryFilter, resultFilter]);

  return (
    <main className="min-h-screen bg-[#030303] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Análisis Diario</h1>
        <p className="text-white/60">
          Biblioteca de análisis técnicos — {filteredAnalyses.length} operaciones disponibles
        </p>
      </div>

      <CommunityAnalysisFeed />

      {/* Buscador */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Busca por activo, título, sesión o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0B0B0B] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none transition"
        />
      </div>

      {/* Filtros */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Categoría */}
        <div>
          <label className="text-sm font-semibold text-white/60 mb-2 block">Categoría</label>
          <div className="flex flex-wrap gap-2">
            {["Todos", "Oro", "Forex", "Crypto"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                  categoryFilter === cat
                    ? "bg-[#D4AF37] text-black"
                    : "bg-[#0B0B0B] border border-white/10 text-white hover:border-[#D4AF37]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resultado */}
        <div>
          <label className="text-sm font-semibold text-white/60 mb-2 block">Resultado</label>
          <div className="flex flex-wrap gap-2">
            {["Todos", "Ganadas", "Perdidas", "En seguimiento"].map((res) => (
              <button
                key={res}
                onClick={() => setResultFilter(res)}
                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                  resultFilter === res
                    ? "bg-[#D4AF37] text-black"
                    : "bg-[#0B0B0B] border border-white/10 text-white hover:border-[#D4AF37]/50"
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-end">
          <div className="text-sm text-white/50">
            Mostrando <span className="text-[#D4AF37] font-bold">{filteredAnalyses.length}</span> de{" "}
            <span className="text-[#D4AF37] font-bold">{analyses.length}</span> análisis
          </div>
        </div>
      </div>

      {/* Grid de análisis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {filteredAnalyses.map((analysis) => (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedAnalysis(analysis)}
            className="rounded-lg border border-white/10 bg-[#0B0B0B] p-5 cursor-pointer hover:border-[#D4AF37]/40 transition hover:shadow-lg hover:shadow-[#D4AF37]/10"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">{analysis.symbol}</p>
                <p className="text-sm text-white/60 mt-1">{analysis.date}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  analysis.status === "Ganada"
                    ? "bg-green-400/20 text-green-300"
                    : analysis.status === "Perdida"
                    ? "bg-red-400/20 text-red-300"
                    : "bg-yellow-400/20 text-yellow-300"
                }`}
              >
                {analysis.status}
              </span>
            </div>

            {/* Título */}
            <p className="font-bold text-white mb-3">{analysis.title}</p>

            {/* Metadata */}
            <div className="space-y-2 mb-4 text-sm text-white/60">
              <div>
                <span className="text-white/40">Sesión:</span> {analysis.session}
              </div>
              <div>
                <span className="text-white/40">Tipo:</span> {analysis.type}
              </div>
              <div>
                <span className="text-white/40">Riesgo:</span> {analysis.risk}
              </div>
            </div>

            {/* Resultado */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p className="text-sm text-white/60">Resultado</p>
              <p
                className={`text-lg font-bold ${
                  analysis.result.startsWith("+")
                    ? "text-green-400"
                    : analysis.result === "±0%" || analysis.result.startsWith("±")
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {analysis.result}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Panel de detalle */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnalysis(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B0B0B] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header con cierre */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-[#D4AF37]">{selectedAnalysis.symbol}</p>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedAnalysis.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="text-white/40 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Información general */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg bg-[#030303] border border-white/10 p-3">
                <p className="text-xs text-white/50 mb-1">Fecha</p>
                <p className="font-bold text-white">{selectedAnalysis.date}</p>
              </div>
              <div className="rounded-lg bg-[#030303] border border-white/10 p-3">
                <p className="text-xs text-white/50 mb-1">Sesión</p>
                <p className="font-bold text-white">{selectedAnalysis.session}</p>
              </div>
              <div className="rounded-lg bg-[#030303] border border-white/10 p-3">
                <p className="text-xs text-white/50 mb-1">Tipo</p>
                <p className="font-bold text-white">{selectedAnalysis.type}</p>
              </div>
              <div className="rounded-lg bg-[#030303] border border-white/10 p-3">
                <p className="text-xs text-white/50 mb-1">Riesgo</p>
                <p className="font-bold text-white">{selectedAnalysis.risk}</p>
              </div>
            </div>

            {/* Resultado */}
            <div
              className={`rounded-lg p-4 mb-6 border ${
                selectedAnalysis.status === "Ganada"
                  ? "bg-green-400/10 border-green-400/30"
                  : selectedAnalysis.status === "Perdida"
                  ? "bg-red-400/10 border-red-400/30"
                  : "bg-yellow-400/10 border-yellow-400/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Estado de operación</p>
                  <p className="text-2xl font-bold text-white">{selectedAnalysis.status}</p>
                </div>
                <p
                  className={`text-3xl font-bold ${
                    selectedAnalysis.result.startsWith("+")
                      ? "text-green-400"
                      : selectedAnalysis.result === "±0%" || selectedAnalysis.result.startsWith("±")
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedAnalysis.result}
                </p>
              </div>
            </div>

            {/* Escenario */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Escenario</h3>
              <p className="text-white/70 leading-relaxed">{selectedAnalysis.scenario}</p>
            </div>

            {/* Estructura de operación */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-[#030303] border border-white/10 p-4">
                <p className="text-xs text-white/50 mb-2 uppercase font-bold">Entrada (Entry)</p>
                <p className="font-bold text-white">{selectedAnalysis.entry}</p>
              </div>
              <div className="rounded-lg bg-red-400/10 border border-red-400/30 p-4">
                <p className="text-xs text-red-300 mb-2 uppercase font-bold">Stop Loss (SL)</p>
                <p className="font-bold text-red-300">{selectedAnalysis.sl}</p>
              </div>
              <div className="rounded-lg bg-green-400/10 border border-green-400/30 p-4">
                <p className="text-xs text-green-300 mb-2 uppercase font-bold">Take Profit (TP)</p>
                <p className="font-bold text-green-300">{selectedAnalysis.tp}</p>
              </div>
            </div>

            {/* Aprendizaje */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Aprendizaje clave</h3>
              <div className="rounded-lg bg-[#030303] border border-[#D4AF37]/20 p-4">
                <p className="text-white/80">{selectedAnalysis.learning}</p>
              </div>
            </div>

            {/* Estado final */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Resultado final</h3>
              <div className="rounded-lg bg-[#030303] border border-white/10 p-4">
                <p className="text-white/70">{selectedAnalysis.finalStatus}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <DisclaimerNote variant="risk" />
            </div>

            {/* Botón de cierre */}
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="w-full mt-6 rounded-lg bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#f5d76e]"
            >
              Entendido
            </button>
          </motion.div>
        </div>
      )}

      {/* Sin resultados */}
      {filteredAnalyses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">No se encontraron análisis con los filtros seleccionados.</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-white/40">
        <p>
          Información educativa y operativa. El trading real implica riesgo; opera solo con capital que puedas asumir.
        </p>
      </div>
    </main>
  );
}
