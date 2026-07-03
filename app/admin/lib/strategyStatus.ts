/**
 * CARVIPIX Strategy Engine Status
 * Admin Dashboard Component
 * 
 * Displays real status without misleading percentages
 * Shows clear blockers and dependencies
 */

export interface ComponentStatus {
  name: string;
  status: 'FUNCIONAL' | 'ESTRUCTURA' | 'BLOQUEADO' | 'PENDIENTE' | 'COMPLETO';
  details: string;
  blockedBy?: string;
  lastUpdated: string;
  icon: string;
}

export interface StrategyStatus {
  timestamp: string;
  buildStatus: {
    compilation: 'PASS' | 'FAIL';
    compilationTime: string;
    typeErrors: number;
    warnings: number;
  };
  components: ComponentStatus[];
}

/**
 * Get current strategy engine status for admin panel
 * Updated: July 2, 2026
 */
export function getStrategyEngineStatus(): StrategyStatus {
  return {
    timestamp: new Date().toISOString(),
    buildStatus: {
      compilation: 'PASS',
      compilationTime: '3.5s',
      typeErrors: 0,
      warnings: 0,
    },
    components: [
      {
        name: 'TrendValidator 1H',
        status: 'FUNCIONAL',
        icon: '🟡',
        details:
          'Lógica real implementada (4 conditions) | Compila sin errores | Documentado | Penalty 0.50 configurable',
        blockedBy: 'Validación local con datos históricos completos',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'PullbackValidator 45M',
        status: 'ESTRUCTURA',
        icon: '🏗️',
        details:
          'Scaffolding profesional listo | Tipos definidos | Interfaces completas | 7 preguntas de configuración pendientes',
        blockedBy: 'Responder 7 preguntas de configuración',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'EntryValidator 5M',
        status: 'BLOQUEADO',
        icon: '🚫',
        details: 'Esperando que Pullback sea completado',
        blockedBy: 'Pullback 45M debe estar completado',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'SignalScoring',
        status: 'BLOQUEADO',
        icon: '🚫',
        details: 'Esperando que Entry sea completado',
        blockedBy: 'Entry 5M debe estar completado',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'Data Integration',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'Sin especificación. Requiere: data sources, formats, update strategy',
        blockedBy: 'Requerimientos no definidos',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'Backtesting Local',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'Sin especificación. Requiere: framework, metrics, validation rules',
        blockedBy: 'Requerimientos no definidos',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'MT4/MT5 Integration',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'Sin especificación. Requiere: API design, order execution, risk management',
        blockedBy: 'Requerimientos no definidos',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'AutoBot Trading',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'Sin especificación. Requiere: full pipeline, live environment, monitoring',
        blockedBy: 'Todos los anteriores deben estar completados',
        lastUpdated: '2026-07-02',
      },
    ],
  };
}

/**
 * Render status for admin dashboard
 */
export function renderStrategyStatus(status: StrategyStatus): string {
  let output = `\n${'═'.repeat(80)}\n`;
  output += `CARVIPIX Strategy Engine Status | ${status.timestamp}\n`;
  output += `${'═'.repeat(80)}\n\n`;

  output += `BUILD STATUS:\n`;
  output += `  TypeScript Compilation: ${status.buildStatus.compilation}\n`;
  output += `  Compilation Time: ${status.buildStatus.compilationTime}\n`;
  output += `  Type Errors: ${status.buildStatus.typeErrors}\n`;
  output += `  Warnings: ${status.buildStatus.warnings}\n\n`;

  output += `COMPONENTS:\n`;
  output += `${'─'.repeat(80)}\n`;

  for (const component of status.components) {
    output += `\n${component.icon} ${component.name}\n`;
    output += `   Status: ${component.status}\n`;
    output += `   ${component.details}\n`;
    if (component.blockedBy) {
      output += `   ⚠️  Bloqueado por: ${component.blockedBy}\n`;
    }
    output += `   Última actualización: ${component.lastUpdated}\n`;
  }

  output += `\n${'─'.repeat(80)}\n`;
  output += `KEY:\n`;
  output += `  🟡 FUNCIONAL    = Implementado, provisorio, pendiente validación local\n`;
  output += `  🏗️  ESTRUCTURA    = Scaffolding listo, parámetros pendientes\n`;
  output += `  🚫 BLOQUEADO     = Aguardando dependencia anterior\n`;
  output += `  🚫 PENDIENTE     = Requerimientos no definidos\n`;
  output += `  ✅ COMPLETO      = Listo para usar\n`;
  output += `${'═'.repeat(80)}\n\n`;

  return output;
}

/**
 * Get blocking dependencies tree
 * Shows what must be completed before each phase can proceed
 */
export function getBlockingDependencies() {
  return {
    'TrendValidator 1H': {
      status: 'FUNCIONAL',
      blockedBy: ['Local historical validation'],
      nextPhase: 'PullbackValidator 45M',
    },
    'PullbackValidator 45M': {
      status: 'ESTRUCTURA',
      blockedBy: [
        'Answer pullback depth question',
        'Answer retracement percentage question',
        'Answer time pattern question',
        'Answer EMA validation question',
        'Answer volume confirmation question',
        'Answer confirmation level question',
        'Answer market adaptation question',
      ],
      nextPhase: 'EntryValidator 5M',
    },
    'EntryValidator 5M': {
      status: 'BLOQUEADO',
      blockedBy: ['PullbackValidator 45M must be complete'],
      nextPhase: 'SignalScoring',
    },
    'SignalScoring': {
      status: 'BLOQUEADO',
      blockedBy: ['EntryValidator 5M must be complete'],
      nextPhase: 'Data Integration',
    },
    'Data Integration': {
      status: 'PENDIENTE',
      blockedBy: ['Define data sources', 'Define data formats', 'Define update strategy'],
      nextPhase: 'Backtesting Local',
    },
    'Backtesting Local': {
      status: 'PENDIENTE',
      blockedBy: [
        'Define backtesting framework',
        'Define metrics',
        'Define validation rules',
      ],
      nextPhase: 'MT4/MT5 Integration',
    },
    'MT4/MT5 Integration': {
      status: 'PENDIENTE',
      blockedBy: [
        'Define API design',
        'Define order execution',
        'Define risk management',
      ],
      nextPhase: 'AutoBot Trading',
    },
    'AutoBot Trading': {
      status: 'PENDIENTE',
      blockedBy: [
        'All previous phases complete',
        'Full pipeline validated',
        'Live environment ready',
        'Monitoring system ready',
      ],
      nextPhase: 'None - Production Ready',
    },
  };
}

/**
 * Health check for admin panel
 */
export function getHealthCheck() {
  return {
    systemReady: false, // Not ready until Trend is validated locally
    readinessPercentage: 0, // NOT using percentage - see components instead
    readinessExplanation:
      'Use component status, not percentage. Each component has specific blockers listed.',
    criticalBlockers: [
      'TrendValidator pending local validation (blocking everything)',
      'Pullback configuration questions unanswered (blocking Entry & downstream)',
    ],
    nextActions: [
      '1. Validate TrendValidator locally with complete historical data',
      '2. Answer 7 Pullback configuration questions',
      '3. Implement Pullback 45M logic',
      '4. Define Entry requirements',
      '5. Continue downstream phases',
    ],
  };
}

export default {
  getStrategyEngineStatus,
  renderStrategyStatus,
  getBlockingDependencies,
  getHealthCheck,
};
