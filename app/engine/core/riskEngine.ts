export type RiskEngineInput = {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  accountBalance: number;
  riskPercent: number;
  pipValuePerLot: number;
};

export type RiskValidationIssue = {
  field: keyof RiskEngineInput;
  code: 'NAN' | 'INFINITY' | 'NON_POSITIVE' | 'INVALID_RANGE';
  reason: string;
  blocking: boolean;
};

export type RiskEngineOutput = {
  valid: boolean;
  issues: RiskValidationIssue[];
  riskAmount: number;
  rewardAmount: number;
  ratio: number;
  stopDistance: number;
  targetDistance: number;
  positionSizeLots: number;
  audit: {
    status: 'OK' | 'BLOCKED';
    reason: string;
    timestamp: number;
    engineVersion: string;
  };
};

const ENGINE_VERSION = 'CARVIPIX_RISK_v1.0';

function isInvalidNumber(value: number): 'NAN' | 'INFINITY' | null {
  if (Number.isNaN(value)) return 'NAN';
  if (!Number.isFinite(value)) return 'INFINITY';
  return null;
}

function issue(
  field: keyof RiskEngineInput,
  code: RiskValidationIssue['code'],
  reason: string,
  blocking = true
): RiskValidationIssue {
  return { field, code, reason, blocking };
}

export function evaluateRisk(input: RiskEngineInput): RiskEngineOutput {
  const issues: RiskValidationIssue[] = [];

  (Object.entries(input) as Array<[keyof RiskEngineInput, number]>).forEach(([field, value]) => {
    const invalidCode = isInvalidNumber(value);
    if (invalidCode) {
      issues.push(issue(field, invalidCode, `${field} contiene valor invalido (${invalidCode})`));
    }
  });

  if (input.entryPrice <= 0) issues.push(issue('entryPrice', 'NON_POSITIVE', 'entryPrice debe ser > 0'));
  if (input.stopLossPrice <= 0) issues.push(issue('stopLossPrice', 'NON_POSITIVE', 'stopLossPrice debe ser > 0'));
  if (input.takeProfitPrice <= 0) issues.push(issue('takeProfitPrice', 'NON_POSITIVE', 'takeProfitPrice debe ser > 0'));
  if (input.accountBalance <= 0) issues.push(issue('accountBalance', 'NON_POSITIVE', 'accountBalance debe ser > 0'));
  if (input.pipValuePerLot <= 0) issues.push(issue('pipValuePerLot', 'NON_POSITIVE', 'pipValuePerLot debe ser > 0'));
  if (input.riskPercent <= 0 || input.riskPercent > 100) {
    issues.push(issue('riskPercent', 'INVALID_RANGE', 'riskPercent debe estar en (0,100]'));
  }

  const stopDistance = Math.abs(input.entryPrice - input.stopLossPrice);
  const targetDistance = Math.abs(input.takeProfitPrice - input.entryPrice);

  if (stopDistance <= 0) {
    issues.push(issue('stopLossPrice', 'INVALID_RANGE', 'Stop distance debe ser > 0'));
  }
  if (targetDistance <= 0) {
    issues.push(issue('takeProfitPrice', 'INVALID_RANGE', 'Target distance debe ser > 0'));
  }

  const riskAmount = input.accountBalance * (input.riskPercent / 100);
  const rewardAmount = stopDistance > 0 ? (riskAmount * (targetDistance / stopDistance)) : 0;
  const ratio = stopDistance > 0 ? targetDistance / stopDistance : 0;
  const positionSizeLots = stopDistance > 0
    ? Number((riskAmount / (stopDistance * input.pipValuePerLot)).toFixed(4))
    : 0;

  const valid = issues.filter((x) => x.blocking).length === 0;

  return {
    valid,
    issues,
    riskAmount: Number(riskAmount.toFixed(2)),
    rewardAmount: Number(rewardAmount.toFixed(2)),
    ratio: Number(ratio.toFixed(4)),
    stopDistance: Number(stopDistance.toFixed(6)),
    targetDistance: Number(targetDistance.toFixed(6)),
    positionSizeLots,
    audit: {
      status: valid ? 'OK' : 'BLOCKED',
      reason: valid ? 'Riesgo validado' : `Bloqueado por ${issues.length} inconsistencia(s)`,
      timestamp: Date.now(),
      engineVersion: ENGINE_VERSION,
    },
  };
}
