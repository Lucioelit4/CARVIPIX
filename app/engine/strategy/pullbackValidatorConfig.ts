export interface PullbackValidatorConfig {
  pullbackDepth: {
    minAtrMultiple: number;
    maxAtrMultiple: number;
  };
  movement: {
    minStrength: number;
  };
  volatility: {
    maxAtr: number;
  };
  sync: {
    requireStrictCloseAlignment: boolean;
    requireNoFutureLeakage: boolean;
  };
  diagnosticMode: boolean;
  logValidationSteps: boolean;
  status: 'READY';
  version: string;
  lastUpdated: string;
}

export const PULLBACK_VALIDATOR_CONFIG: PullbackValidatorConfig = {
  pullbackDepth: {
    minAtrMultiple: 0.2,
    maxAtrMultiple: 1.25,
  },
  movement: {
    minStrength: 55,
  },
  volatility: {
    maxAtr: 8,
  },
  sync: {
    requireStrictCloseAlignment: true,
    requireNoFutureLeakage: true,
  },
  diagnosticMode: false,
  logValidationSteps: false,
  status: 'READY',
  version: '1.0.0',
  lastUpdated: '2026-07-10T00:00:00.000Z',
};

export function getPullbackValidatorConfig(
  override?: Partial<PullbackValidatorConfig>
): PullbackValidatorConfig {
  return {
    ...PULLBACK_VALIDATOR_CONFIG,
    ...override,
    pullbackDepth: {
      ...PULLBACK_VALIDATOR_CONFIG.pullbackDepth,
      ...(override?.pullbackDepth ?? {}),
    },
    movement: {
      ...PULLBACK_VALIDATOR_CONFIG.movement,
      ...(override?.movement ?? {}),
    },
    volatility: {
      ...PULLBACK_VALIDATOR_CONFIG.volatility,
      ...(override?.volatility ?? {}),
    },
    sync: {
      ...PULLBACK_VALIDATOR_CONFIG.sync,
      ...(override?.sync ?? {}),
    },
  };
}

export function getPullbackRequirements() {
  return {
    status: 'CONFIGURED',
    requiredAnswers: [],
    nextStep: 'Configuration active for internal closure mode',
  };
}

export function isPullbackValidatorReady(): boolean {
  return PULLBACK_VALIDATOR_CONFIG.status === 'READY';
}

export default PULLBACK_VALIDATOR_CONFIG;
