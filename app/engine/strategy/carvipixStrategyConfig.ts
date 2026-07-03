/**
 * CARVIPIX Strategy v1.0 - Configuration
 * Configuración oficial registrada de la estrategia
 * Privado / Admin only
 */

import {
  CarvipixStrategyConfig,
  StrategyPendingRule,
  AgentConfig,
  BacktestingProgress,
} from './carvipixStrategyTypes';

export const CARVIPIX_STRATEGY_V1: CarvipixStrategyConfig = {
  version: '1.0',
  name: 'CARVIPIX',
  status: 'definition',

  // Activos operacionales
  assets: ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD'],

  // Temporalidades y sus roles
  timeframes: [
    {
      timeframe: '1H',
      role: 'primary_trend',
      emas: [20, 50, 200],
      description: 'Define la dirección primaria y la estructura mayor',
    },
    {
      timeframe: '45M',
      role: 'confirmation',
      emas: [20, 50, 200],
      description: 'Confirma el retroceso y la estructura dentro de 1H',
    },
    {
      timeframe: '5M',
      role: 'entry_tactical',
      emas: [20, 50, 200],
      description: 'Detección de entrada táctica, confluencia final',
    },
  ],

  // EMAs configuración
  emas: [20, 50, 200],

  // Agentes votantes (11 total)
  agents: [
    {
      name: 'Market Regime',
      purpose: 'Detectar tendencia vs rango',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Trend Agent',
      purpose: 'Validar dirección primaria (1H)',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Structure Agent',
      purpose: 'Analizar máximos y mínimos',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Momentum Agent',
      purpose: 'Medir velocidad del cambio (RSI, MACD)',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Pullback Agent',
      purpose: 'Detectar retroceso válido (45M)',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Session Agent',
      purpose: 'Evaluar sesión de trading activa',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'News Agent',
      purpose: 'Evitar trades cerca de news relevantes',
      weightInConsensus: 1,
      implementationStatus: 'stub',
    },
    {
      name: 'Risk Manager',
      purpose: 'Validar SL/TP y gestión de riesgo',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Confidence Scorer',
      purpose: 'Calcular certeza general del setup',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Trade Validator',
      purpose: 'Validar pre-entrada y estado actual',
      weightInConsensus: 1,
      implementationStatus: 'active',
    },
    {
      name: 'Learning Engine',
      purpose: 'Análisis histórico y mejora iterativa',
      weightInConsensus: 1,
      implementationStatus: 'stub',
    },
  ],

  // Consenso requerido
  consensusThreshold: 7, // 7/11 aprobación para SIGNAL
  alternativeThresholds: {
    strict: 8, // 8/11 más estricto
    ultraStrict: 9, // 9/11 ultra conservador
  },

  // Reglas pendientes para v1.1
  pendingRules: [
    {
      name: 'Trend Detection - 1H Criteria',
      category: 'trend_detection',
      status: 'pending',
      description:
        'Criterio exacto para identificar tendencia UP, DOWN o NEUTRAL en 1H. Opciones: EMA stack, estructura de máximos/mínimos, RSI threshold.',
      candidateImplementations: [
        'EMA 20 > 50 > 200 (UP) / 20 < 50 < 200 (DOWN)',
        'Últimas 3 velas en dirección + EMA stack',
        'Estructura de máximos crecientes (UP) / decrecientes (DOWN)',
        'RSI > 50 (UP) / < 50 (DOWN) + EMA confirmation',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Pullback Validation - 45M Criteria',
      category: 'pullback_validation',
      status: 'pending',
      description:
        'Criterios de retroceso válido: profundidad mínima/máxima en %, nivel de invalidación, duración mínima.',
      candidateImplementations: [
        'Profundidad 38.2% - 61.8% Fibonacci',
        'ATR-based: min 0.5x ATR, max 2.0x ATR',
        'Invalidación: ruptura de soporte primario',
        'Duración: min 2 velas 45M, max 10 velas 45M',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Entry Confirmation - 5M Trigger',
      category: 'entry_confirmation',
      status: 'pending',
      description:
        'Trigger exacto que confirma entrada en 5M dentro del retroceso 45M. Puede ser: EMA cross, ruptura de resistencia, impulso candlestick.',
      candidateImplementations: [
        'EMA 20 cruza sobre EMA 50 (en dirección de tendencia)',
        'Cierre por encima de resistencia local',
        'Cierre por encima de EMA 50 (5M) + impulso',
        'Piercing candlestick + cierre en upper half',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Stop Loss Calculation',
      category: 'stop_loss_calculation',
      status: 'pending',
      description:
        'Fórmula exacta para calcular SL. Opciones: ATR-based, structure-based, EMA-based con buffer específico.',
      candidateImplementations: [
        'SL = Entry ± 1.5 × ATR(14)',
        'SL = Debajo último swing low + 5 pips',
        'SL = Debajo EMA 50 (5M) + 10 pips',
        'SL = Debajo soporte estructura + 5% margin',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Take Profit Calculation',
      category: 'take_profit_calculation',
      status: 'pending',
      description:
        'Cálculo de TP1, TP2, TP3. Opciones: Risk-Reward ratios, niveles estructura, trailing stop.',
      candidateImplementations: [
        'TP1: Entry + 1.0x Risk (50% posición)',
        'TP2: Entry + 2.0x Risk (30% posición) + Trailing ATR',
        'TP3: Resistencia estructura 1H o max 5.0x Risk (20% posición)',
        'Cierre forzado: Max 60 velas 5M o cambio de tendencia 1H',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Confidence Score Calculation',
      category: 'score_confidence',
      status: 'pending',
      description:
        'Cómo combinar votos de 11 agentes en un score 0-100. Fórmula: weighted average, majority voting, custom weighting.',
      candidateImplementations: [
        'Score = (approved_count / 11) × 100',
        'Score = Promedio ponderado (agentes con peso diferente)',
        'Score = Base 50 + (approved_count - 5.5) × (100/11)',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Daily Risk Limits',
      category: 'daily_limits',
      status: 'pending',
      description:
        'Límites operacionales diarios: máximo trades, drawdown máximo diario, capital máximo abierto.',
      candidateImplementations: [
        'Max 3 trades/día | Max drawdown 2% | Max capital 50%',
        'Max 5 trades/día | Max drawdown 3% | Max capital 75%',
        'Trailing: Stop si 2 consecutive losses o -1% daily',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'News Handling',
      category: 'news_handling',
      status: 'pending',
      description:
        'Cómo evitar trades cerca de news económicas relevantes: cuántos minutos antes/después.',
      candidateImplementations: [
        'No operar en ±30 min de high impact news',
        'No operar en ±60 min de medium+ impact',
        'News Agent veto automático',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Pre-Entry Invalidation Rules',
      category: 'entry_confirmation',
      status: 'pending',
      description:
        'Reglas que invalidan una señal LISTA justo antes de ejecutar (durante últimos segundos).',
      candidateImplementations: [
        'Ruptura de SL nivel',
        'Cambio de dirección de tendencia 1H',
        'Consenso cae por debajo de 7/11 justo antes de market order',
      ],
      targetVersion: '1.1',
    },
    {
      name: 'Trailing Stop Rules',
      category: 'take_profit_calculation',
      status: 'pending',
      description:
        'Reglas exactas para trailing stop entre TP1 y TP2. Método: ATR-based, % distance, puntos fijos.',
      candidateImplementations: [
        'Trailing = 1.0 × ATR(14)',
        'Trailing = 1.5% por debajo del precio actual',
        'Trailing = 20 pips fijos',
      ],
      targetVersion: '1.1',
    },
  ],

  // Progreso de backtesting
  backtestingProgress: {
    version: '1.0',
    status: 'not_started',
    datasetsTested: [],
    overallStats: {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageRR: 0,
      maxDrawdown: 0,
    },
    readyForNextPhase: false,
    notes: 'Backtesting begins after v1.1 rules are implemented',
  },
};

/**
 * Constantes estratégicas
 */
export const CARVIPIX_CONSTANTS = {
  // Activos
  PRIMARY_ASSET: 'XAUUSD' as const,
  SUPPORTED_ASSETS: ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD'] as const,

  // Timeframes
  TIMEFRAME_PRIMARY: '1H' as const,
  TIMEFRAME_CONFIRMATION: '45M' as const,
  TIMEFRAME_ENTRY: '5M' as const,

  // EMAs
  EMA_SHORT: 20,
  EMA_MEDIUM: 50,
  EMA_LONG: 200,

  // Consenso
  CONSENSUS_THRESHOLD: 7,
  CONSENSUS_STRICT: 8,
  CONSENSUS_ULTRA_STRICT: 9,
  TOTAL_AGENTS: 11,

  // Estados (PENDING: ajustar según reglas v1.1)
  MAX_DAILY_TRADES: 3, // PENDING
  MAX_DAILY_DRAWDOWN_PERCENT: 2, // PENDING
  MAX_CAPITAL_OPEN_PERCENT: 50, // PENDING
  RISK_PER_TRADE_PERCENT: 1, // PENDING

  // Privacidad
  STRATEGY_STATUS: 'DEFINITION - PENDING RULES V1.1' as const,
  STRATEGY_ACCESS: 'PRIVATE / ADMIN ONLY' as const,
};

/**
 * Helper: Validar estrategia lista para backtesting
 */
export function isReadyForBacktesting(config: CarvipixStrategyConfig): {
  ready: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  // Verificar pendientes críticos
  const criticalPendings = config.pendingRules.filter(
    (rule) =>
      rule.category === 'trend_detection' ||
      rule.category === 'pullback_validation' ||
      rule.category === 'entry_confirmation' ||
      rule.category === 'stop_loss_calculation' ||
      rule.category === 'take_profit_calculation'
  );

  if (criticalPendings.some((r) => r.status === 'pending')) {
    blockers.push(
      `${criticalPendings.filter((r) => r.status === 'pending').length} reglas críticas aún pending`
    );
  }

  // Verificar implementación de agentes
  const stubAgents = config.agents.filter((a) => a.implementationStatus === 'stub');
  if (stubAgents.length > 0) {
    blockers.push(`${stubAgents.length} agentes aún en stub (News Agent, Learning Engine)`);
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

/**
 * Helper: Mostrar resumen status
 */
export function printStrategyStatus(): void {
  const status = isReadyForBacktesting(CARVIPIX_STRATEGY_V1);

  console.log('\n=== CARVIPIX Strategy v1.0 Status ===');
  console.log(`Version: ${CARVIPIX_STRATEGY_V1.version}`);
  console.log(`Status: ${CARVIPIX_STRATEGY_V1.status}`);
  console.log(`Primary Asset: ${CARVIPIX_CONSTANTS.PRIMARY_ASSET}`);
  console.log(`Consensus Threshold: ${CARVIPIX_CONSTANTS.CONSENSUS_THRESHOLD}/11`);

  console.log(`\nBacktesting Ready: ${status.ready ? 'NO' : 'NO'}`);
  if (!status.ready) {
    console.log('Blockers:');
    status.blockers.forEach((b) => console.log(`  - ${b}`));
  }

  console.log(`\nPending Rules: ${CARVIPIX_STRATEGY_V1.pendingRules.filter((r) => r.status === 'pending').length}/10`);
  console.log(`\nNEXT: Implement v1.1 - Define exact rules for trend, pullback, entry, SL, TP`);
  console.log('===============================\n');
}

/**
 * Export para testing
 */
export default CARVIPIX_STRATEGY_V1;
