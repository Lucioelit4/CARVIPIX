import type {
  CertifiedDatasetEnvelope,
  ConflictDescriptor,
  ConsensusResult,
  CreateAlertOptions,
  EvidenceAssessment,
  EngineAction,
  EngineMetrics,
  PriorityLevel,
  ResearchProposalEnvelope,
  SafetyGateEvaluation,
  TradeAlert,
  TradeSignal,
} from '../types';
import { AuditEngine } from './auditEngine';
import { ConflictResolutionEngine } from './conflictResolutionEngine';
import { EvidenceEngine } from './evidenceEngine';
import { PriorityEngine } from './priorityEngine';
import { SafeModePolicy } from './safeModePolicy';

export class IntelligenceDirector {
  constructor(
    private readonly auditEngine: AuditEngine,
    private readonly priorityEngine: PriorityEngine,
    private readonly conflictResolutionEngine: ConflictResolutionEngine,
    private readonly safeModePolicy: SafeModePolicy,
    private readonly evidenceEngine: EvidenceEngine,
  ) {}

  decideAlertCreation(input: {
    signal: TradeSignal;
    consensusResult: ConsensusResult;
    safetyGateResults?: SafetyGateEvaluation;
    options?: CreateAlertOptions;
    metrics: EngineMetrics;
    createAlert: () => TradeAlert;
  }): TradeAlert | null {
    const priority = this.priorityEngine.normalizePriority(input.options?.priority);
    const conflicts = input.options?.conflicts ?? [];
    const evidenceAssessment = this.evidenceEngine.evaluate({
      signal: input.signal,
      consensus: input.consensusResult,
      contextSnapshot: input.options?.contextSnapshot,
      evidenceInput: input.options?.evidenceInput,
    });

    const rejection =
      this.rejectForEvidence(input.signal, input.consensusResult, evidenceAssessment, priority, conflicts) ||
      this.rejectForInvalidSignal(input.signal, input.consensusResult, priority, conflicts) ||
      this.rejectForResearchProposalEnvelope(input.signal, input.consensusResult, input.options, priority, conflicts) ||
      this.rejectForUncertifiedInput(input.signal, input.consensusResult, input.options, priority, conflicts) ||
      this.rejectForCorruptedData(input.signal, input.consensusResult, input.options, priority, conflicts) ||
      this.rejectForPriority(input.signal, input.consensusResult, priority, conflicts) ||
      this.rejectForConflict(input.signal, input.consensusResult, conflicts, priority) ||
      this.rejectForExecutionAttempt(input.signal, input.consensusResult, input.options, priority, conflicts) ||
      this.rejectForSafetyGates(input.signal, input.consensusResult, input.safetyGateResults, priority, conflicts) ||
      this.rejectForConsensus(input.signal, input.consensusResult, priority, conflicts);

    if (rejection) {
      this.auditEngine.recordDecision(rejection);
      return null;
    }

    const alert = input.createAlert();
    this.auditEngine.recordDecision({
      symbol: input.signal.symbol,
      type: input.signal.type,
      timeframe: input.signal.timeframe,
      consensus: input.consensusResult,
      action: 'ALERT_CREATED',
      priority,
      conflicts,
      alertCreated: alert.id,
      reason: `Alerta creada: ${alert.id}`,
    });
    return alert;
  }

  private rejectForEvidence(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    evidence: EvidenceAssessment,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (consensusResult.outcome === 'rejected') {
      return null;
    }

    if (!evidence.valid) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Evidence inválida para ${signal.id}: ${evidence.issues.map((issue) => issue.reason).join(' | ')}`,
      };
    }

    const hasCriticalConflict = evidence.conflicts.some((conflict) => conflict.severity === 'critical');
    if (hasCriticalConflict) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Conflicto crítico de evidencia para ${signal.id}: ${evidence.conflicts
          .map((conflict) => conflict.reason)
          .join(' | ')}`,
      };
    }

    if (evidence.decisionQuality < 0.55) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'WAIT' as EngineAction,
        priority,
        conflicts,
        reason: `Calidad de decisión insuficiente para ${signal.id}: ${evidence.decisionQuality.toFixed(3)} (prob=${evidence.probability.toFixed(3)}, conf=${evidence.confidence.toFixed(3)}, unc=${evidence.uncertainty.toFixed(3)})`,
      };
    }

    return null;
  }

  private rejectForResearchProposalEnvelope(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    options: CreateAlertOptions | undefined,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    const envelope = options?.researchProposalEnvelope;
    if (!envelope) {
      return null;
    }

    const issues = this.getResearchProposalEnvelopeIssues(envelope);
    if (issues.length === 0) {
      return null;
    }

    return {
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      action: 'NO_TRADE' as EngineAction,
      priority,
      conflicts,
      reason: `Research Proposal Envelope inválido para ${signal.id}: ${issues.join(', ')}`,
    };
  }

  private rejectForInvalidSignal(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    const hasInvalidPrice =
      !Number.isFinite(signal.entryPrice) ||
      !Number.isFinite(signal.takeProfitPrice) ||
      !Number.isFinite(signal.stopLossPrice) ||
      signal.entryPrice <= 0 ||
      signal.takeProfitPrice <= 0 ||
      signal.stopLossPrice <= 0;

    const hasInvalidRiskReward = !Number.isFinite(signal.riskRewardRatio) || signal.riskRewardRatio <= 0;
    const hasMissingIdentity = !signal.id?.trim() || !signal.symbol?.trim() || !signal.timeframe?.trim();

    if (!hasInvalidPrice && !hasInvalidRiskReward && !hasMissingIdentity) {
      return null;
    }

    const issues: string[] = [];
    if (hasMissingIdentity) {
      issues.push('missing signal identity fields');
    }
    if (hasInvalidPrice) {
      issues.push('invalid price levels');
    }
    if (hasInvalidRiskReward) {
      issues.push('invalid riskRewardRatio');
    }

    return {
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      action: 'NO_TRADE' as EngineAction,
      priority,
      conflicts,
      reason: `Señal inválida para ${signal.id}: ${issues.join(', ')}`,
    };
  }

  private rejectForUncertifiedInput(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    options: CreateAlertOptions | undefined,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    const certifiedInput = options?.certifiedInput;
    if (!certifiedInput?.required) {
      return null;
    }

    if (certifiedInput.datasets.length === 0) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'WAIT' as EngineAction,
        priority,
        conflicts,
        reason: `Datos certificados requeridos y no disponibles para ${signal.id}`,
      };
    }

    const malformedDatasets = certifiedInput.datasets.filter(
      (dataset: CertifiedDatasetEnvelope) => !this.isCertifiedDatasetEnvelopeValid(dataset),
    );
    if (malformedDatasets.length > 0) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Datasets certificados incompletos o inválidos para ${signal.id}: ${malformedDatasets
          .map((dataset: CertifiedDatasetEnvelope) => this.describeInvalidDataset(dataset))
          .join(' | ')}`,
      };
    }

    const uncertifiedDatasets = certifiedInput.datasets.filter(
      (dataset: CertifiedDatasetEnvelope) => dataset.status !== 'CERTIFIED',
    );
    if (uncertifiedDatasets.length === 0) {
      return null;
    }

    return {
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      action: 'NO_TRADE' as EngineAction,
      priority,
      conflicts,
      reason: `Datasets no certificados para ${signal.id}: ${uncertifiedDatasets
        .map((dataset: CertifiedDatasetEnvelope) => `${dataset.source}:${dataset.datasetId}:${dataset.status}`)
        .join(' | ')}`,
    };
  }

  private rejectForCorruptedData(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    options: CreateAlertOptions | undefined,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (options?.dataIntegrityValid === false) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Datos corruptos o inconsistentes detectados para ${signal.id}`,
      };
    }
    return null;
  }

  private rejectForPriority(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (this.priorityEngine.shouldReject(priority)) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Prioridad crítica bloqueada para ${signal.id}`,
      };
    }
    return null;
  }

  private rejectForConflict(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    conflicts: ConflictDescriptor[],
    priority: PriorityLevel,
  ) {
    if (this.conflictResolutionEngine.hasBlockingConflict(conflicts)) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'NO_TRADE' as EngineAction,
        priority,
        conflicts,
        reason: `Conflicto bloqueante detectado para ${signal.id}: ${this.conflictResolutionEngine.summarize(conflicts)}`,
      };
    }
    return null;
  }

  private rejectForExecutionAttempt(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    options: CreateAlertOptions | undefined,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (this.safeModePolicy.shouldBlockExecution(options?.executionRequested)) {
      return {
        symbol: signal.symbol,
        type: signal.type,
        timeframe: signal.timeframe,
        consensus: consensusResult,
        action: 'EXECUTE_BLOCKED' as EngineAction,
        priority,
        conflicts,
        reason: `SAFE_MODE activo. Ejecución bloqueada para ${signal.id}`,
      };
    }
    return null;
  }

  private rejectForSafetyGates(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    safetyGateResults: SafetyGateEvaluation | undefined,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (!safetyGateResults || safetyGateResults.criticalFailures.length === 0) {
      return null;
    }

    const realFailures = safetyGateResults.criticalFailures.filter(
      (failure) => failure.reason_isDataMissing !== true && !failure.reason.includes('NO DISPONIBLES'),
    );
    if (realFailures.length === 0) {
      return null;
    }

    return {
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      action: 'NO_TRADE' as EngineAction,
      priority,
      conflicts,
      reason: `Safety gates críticos: ${realFailures.map((failure) => `${failure.gate}: ${failure.reason}`).join(' | ')}`,
    };
  }

  private rejectForConsensus(
    signal: TradeSignal,
    consensusResult: ConsensusResult,
    priority: PriorityLevel,
    conflicts: ConflictDescriptor[],
  ) {
    if (consensusResult.outcome === 'approved') {
      return null;
    }

    return {
      symbol: signal.symbol,
      type: signal.type,
      timeframe: signal.timeframe,
      consensus: consensusResult,
      action: consensusResult.outcome === 'pending' ? ('WAIT' as EngineAction) : ('NO_TRADE' as EngineAction),
      priority,
      conflicts,
      reason: consensusResult.reasonForDecision,
    };
  }

  private isCertifiedDatasetEnvelopeValid(dataset: CertifiedDatasetEnvelope): boolean {
    return (
      Boolean(dataset.datasetId?.trim()) &&
      Boolean(dataset.source?.trim()) &&
      Boolean(dataset.schemaVersion?.trim()) &&
      this.isChecksumValid(dataset.checksum)
    );
  }

  private isChecksumValid(checksum: string | undefined): boolean {
    if (!checksum) {
      return false;
    }

    const normalized = checksum.trim();
    return normalized.length >= 6 && !/\s/.test(normalized);
  }

  private describeInvalidDataset(dataset: CertifiedDatasetEnvelope): string {
    const issues: string[] = [];

    if (!dataset.datasetId?.trim()) {
      issues.push('datasetId missing');
    }

    if (!dataset.source?.trim()) {
      issues.push('source missing');
    }

    if (!dataset.schemaVersion?.trim()) {
      issues.push('schemaVersion missing');
    }

    if (!this.isChecksumValid(dataset.checksum)) {
      issues.push('checksum invalid');
    }

    return `${dataset.source || 'UNKNOWN'}:${dataset.datasetId || 'UNKNOWN'} (${issues.join(', ')})`;
  }

  private getResearchProposalEnvelopeIssues(envelope: ResearchProposalEnvelope): string[] {
    const issues: string[] = [];

    if (!envelope.datasetId?.trim()) {
      issues.push('datasetId missing');
    }

    if (!this.isChecksumValid(envelope.checksum)) {
      issues.push('checksum invalid');
    }

    if (!envelope.schemaVersion?.trim()) {
      issues.push('schemaVersion missing');
    }

    if (envelope.source !== 'RESEARCH_LAB') {
      issues.push('source must be RESEARCH_LAB');
    }

    if (envelope.status !== 'CERTIFIED') {
      issues.push('status must be CERTIFIED');
    }

    if (envelope.manualReviewRequired !== true) {
      issues.push('manualReviewRequired must be true');
    }

    return issues;
  }
}