export type MarketType =
  | "trend_bullish"
  | "trend_bearish"
  | "range"
  | "volatile_breakout"
  | "low_liquidity"
  | "news_event";

export type TradingSession = "asian" | "london" | "new_york" | "overlap" | "off_session";

export type NewsImpact = "none" | "low" | "medium" | "high";

export type RiskTag =
  | "high_impact_news"
  | "high_spread"
  | "off_session"
  | "low_liquidity"
  | "extreme_volatility"
  | "false_breakout"
  | "invalid_structure";

export type TimeframeLabel = "1H" | "45M" | "5M";

export type OperationType = "trend_continuation" | "range_reversion" | "breakout_continuation";

export type InvalidationRule = {
  id: string;
  description: string;
};

export type StrategyKnowledgeCard = {
  id: string;
  name: string;
  definition: string;
  conditions: string[];
  whenToTrade: string[];
  whenNotToTrade: string[];
  risk: "low" | "medium" | "high";
  timeframe: {
    context: "1H";
    structure: "45M";
    entry: "5M";
  };
  expectedDurationMinutes: number;
  example: string;
  validation: string[];
  commonFailure: string;
  initialWeight: number;
  operationType: OperationType;
  invalidationRules: InvalidationRule[];
};

export type TradingKnowledgeBase = {
  marketTypes: MarketType[];
  sessions: TradingSession[];
  newsImpacts: NewsImpact[];
  strategies: StrategyKnowledgeCard[];
  risks: RiskTag[];
  timeframes: TimeframeLabel[];
  operationTypes: OperationType[];
  invalidationRules: InvalidationRule[];
};

export function createTradingKnowledgeBase(): TradingKnowledgeBase {
  const invalidationRules: InvalidationRule[] = [
    { id: "inv-1h-ema-break", description: "Contexto 1H deja de respetar EMA50/EMA200 en direccion operativa." },
    { id: "inv-45m-structure", description: "Estructura 45M rompe ultimo swing esperado para la tesis." },
    { id: "inv-5m-trigger", description: "Entrada 5M invalida trigger antes de confirmar cierre de vela." },
    { id: "inv-news", description: "Evento macro de impacto alto entra en ventana de bloqueo." },
  ];

  const strategies: StrategyKnowledgeCard[] = [
    {
      id: "card-trend-pullback",
      name: "Trend Pullback Continuation",
      definition: "Busca continuidad a favor de tendencia principal tras retroceso controlado.",
      conditions: [
        "1H con EMA20 > EMA50 > EMA200 para compra o inverso para venta.",
        "45M confirma estructura (higher lows / lower highs).",
        "5M confirma gatillo con cierre sobre EMA20 en direccion de tendencia.",
      ],
      whenToTrade: [
        "Sesion london/new_york u overlap.",
        "Sin noticias de alto impacto en ventana activa.",
        "Spread y volatilidad dentro de limites.",
      ],
      whenNotToTrade: [
        "Mercado en rango estrecho.",
        "Liquidez baja u off_session.",
        "Ruptura falsa detectada en 45M o 5M.",
      ],
      risk: "medium",
      timeframe: { context: "1H", structure: "45M", entry: "5M" },
      expectedDurationMinutes: 180,
      example: "EURUSD alcista en 1H, retroceso a EMA50 en 45M y gatillo engulfing en 5M.",
      validation: [
        "RR minimo 1:1.2.",
        "Clasificacion minima A para ejecutar.",
        "Alineacion 1H/45M/5M obligatoria.",
      ],
      commonFailure: "Entrar antes de cierre de vela 5M y quedar atrapado en continuation falsa.",
      initialWeight: 0.85,
      operationType: "trend_continuation",
      invalidationRules,
    },
    {
      id: "card-range-reversion",
      name: "Range Reversion",
      definition: "Opera reversion controlada en extremos del rango con confirmacion fina.",
      conditions: [
        "1H y 45M sin alineacion fuerte de EMAs (regimen lateral).",
        "Precio en borde de rango validado dos o mas veces.",
        "5M muestra rechazo y retorno al interior del rango.",
      ],
      whenToTrade: [
        "Sesion con liquidez moderada/alta.",
        "Spread estable y volatilidad no extrema.",
      ],
      whenNotToTrade: [
        "Noticias de alto impacto.",
        "Rango demasiado estrecho para cubrir costos de spread.",
      ],
      risk: "high",
      timeframe: { context: "1H", structure: "45M", entry: "5M" },
      expectedDurationMinutes: 90,
      example: "GBPUSD en rango 1H, test de resistencia 45M y fallo de ruptura en 5M.",
      validation: [
        "RR minimo 1:1.2.",
        "Stop fuera del extremo del rango.",
      ],
      commonFailure: "Confundir inicio de tendencia real con simple extension del rango.",
      initialWeight: 0.55,
      operationType: "range_reversion",
      invalidationRules,
    },
    {
      id: "card-breakout",
      name: "Volatility Breakout Continuation",
      definition: "Aprovecha ruptura valida con expansion de volatilidad y continuidad.",
      conditions: [
        "1H en transicion de compresion a expansion.",
        "45M confirma quiebre de estructura con cierre limpio.",
        "5M evita falsa ruptura mediante retest valido.",
      ],
      whenToTrade: [
        "Sesion overlap o new_york.",
        "Volatilidad elevada pero no extrema.",
      ],
      whenNotToTrade: [
        "Spread por encima de umbral.",
        "Riesgo de falsa ruptura alto.",
      ],
      risk: "medium",
      timeframe: { context: "1H", structure: "45M", entry: "5M" },
      expectedDurationMinutes: 120,
      example: "XAUUSD rompe resistencia 45M, retest 5M y continuacion inmediata.",
      validation: [
        "Filtro de falsa ruptura debe pasar.",
        "Confirmacion de volumen relativo o momentum.",
      ],
      commonFailure: "Perseguir breakout sin retest y comprar en agotamiento.",
      initialWeight: 0.7,
      operationType: "breakout_continuation",
      invalidationRules,
    },
  ];

  return {
    marketTypes: [
      "trend_bullish",
      "trend_bearish",
      "range",
      "volatile_breakout",
      "low_liquidity",
      "news_event",
    ],
    sessions: ["asian", "london", "new_york", "overlap", "off_session"],
    newsImpacts: ["none", "low", "medium", "high"],
    strategies,
    risks: [
      "high_impact_news",
      "high_spread",
      "off_session",
      "low_liquidity",
      "extreme_volatility",
      "false_breakout",
      "invalid_structure",
    ],
    timeframes: ["1H", "45M", "5M"],
    operationTypes: ["trend_continuation", "range_reversion", "breakout_continuation"],
    invalidationRules,
  };
}
