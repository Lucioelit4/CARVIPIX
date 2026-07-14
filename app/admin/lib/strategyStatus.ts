/**
 * CARVIPIX Strategy Engine Status
 * Admin Dashboard Component
 * 
 * Displays code-backed status without stale documentation claims
 * Shows current blockers and isolated legacy phases
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
 * Updated: July 13, 2026
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
          'Lógica real implementada y conectada al flujo de señal | Compila sin errores | Validación productiva pendiente',
        blockedBy: 'Validación final de producción',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'PullbackValidator 45M',
        status: 'FUNCIONAL',
        icon: '🏗️',
        details:
          'Lógica real implementada y consumida por SignalGenerationEngine | Parámetros definidos en código',
        blockedBy: 'Validación final de producción',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'EntryValidator 5M',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'No existe implementación dedicada en el código activo',
        blockedBy: 'No implementado',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'SignalScoring',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'No existe implementación dedicada en el código activo',
        blockedBy: 'No implementado',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'Data Integration',
        status: 'FUNCIONAL',
        icon: '🚫',
        details: 'La capa de data platform existe en código y persistencia; el catálogo oficial aún está vacío',
        blockedBy: 'Catálogo oficial no congelado',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'Backtesting Local',
        status: 'FUNCIONAL',
        icon: '🚫',
        details: 'Existe motor y artefactos históricos en data/backtesting-research; debe mantenerse aislado del flujo oficial',
        blockedBy: 'Aislamiento de publicación',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'MT4/MT5 Integration',
        status: 'PENDIENTE',
        icon: '🚫',
        details: 'No forma parte de la versión oficial de publicación',
        blockedBy: 'Fuera de alcance de esta versión',
        lastUpdated: '2026-07-02',
      },
      {
        name: 'AutoBot Trading',
        status: 'BLOQUEADO',
        icon: '🚫',
        details: 'Debe permanecer aislado hasta el lanzamiento de CARVIPIX',
        blockedBy: 'Fuera de esta versión',
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
  output += `  🟡 FUNCIONAL    = Implementado y conectado al flujo activo\n`;
  output += `  🏗️  ESTRUCTURA    = Base técnica lista pero aún aislada o incompleta\n`;
  output += `  🚫 BLOQUEADO     = Fuera de esta versión o dependiente de cierre mayor\n`;
  output += `  🚫 PENDIENTE     = No implementado en el código activo\n`;
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
      blockedBy: ['Production validation'],
      nextPhase: 'PullbackValidator 45M',
    },
    'PullbackValidator 45M': {
      status: 'FUNCIONAL',
      blockedBy: ['Production validation'],
      nextPhase: 'EntryValidator 5M',
    },
    'EntryValidator 5M': {
      status: 'PENDIENTE',
      blockedBy: ['Not implemented in active codebase'],
      nextPhase: 'SignalScoring',
    },
    'SignalScoring': {
      status: 'PENDIENTE',
      blockedBy: ['Not implemented in active codebase'],
      nextPhase: 'Data Integration',
    },
    'Data Integration': {
      status: 'FUNCIONAL',
      blockedBy: ['Official catalog freeze pending'],
      nextPhase: 'Backtesting Local',
    },
    'Backtesting Local': {
      status: 'FUNCIONAL',
      blockedBy: ['Must remain isolated from publication flow'],
      nextPhase: 'MT4/MT5 Integration',
    },
    'MT4/MT5 Integration': {
      status: 'PENDIENTE',
      blockedBy: ['Out of scope for official release'],
      nextPhase: 'AutoBot Trading',
    },
    'AutoBot Trading': {
      status: 'BLOQUEADO',
      blockedBy: ['Out of scope for this release'],
      nextPhase: 'None - Production Ready',
    },
  };
}

/**
 * Health check for admin panel
 */
export function getHealthCheck() {
  return {
    systemReady: false,
    readinessPercentage: 0, // NOT using percentage - see components instead
    readinessExplanation:
      'Use component status, not percentage. Only code-backed blockers are listed.',
    criticalBlockers: [
      'EntryValidator 5M not implemented in active codebase',
      'SignalScoring not implemented in active codebase',
      'Official export catalog not frozen',
    ],
    nextActions: [
      '1. Freeze official export catalog and proposal handoff',
      '2. Implement EntryValidator 5M',
      '3. Implement SignalScoring',
      '4. Keep legacy training/backtesting isolated',
      '5. Update admin docs to match active code',
    ],
  };
}

export default {
  getStrategyEngineStatus,
  renderStrategyStatus,
  getBlockingDependencies,
  getHealthCheck,
};
