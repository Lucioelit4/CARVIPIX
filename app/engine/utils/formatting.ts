/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ENGINE UTILITIES
 * Helper functions for engine operations
 */

import { AgentScore, DecisionLogEntry, EngineMetrics } from '../types/index';

/**
 * Format agent score for display
 */
export function formatAgentScore(agent: AgentScore): {
  displayScore: string;
  statusBadge: 'approved' | 'rejected' | 'neutral';
  confidence: string;
} {
  const displayScore = `${agent.score.toFixed(0)}/100`;
  const statusBadge =
    agent.score >= 60 ? 'approved' : agent.score < 40 ? 'rejected' : 'neutral';
  const confidence = `${agent.confidence.toFixed(0)}%`;

  return { displayScore, statusBadge, confidence };
}

/**
 * Get color for agent score
 */
export function getAgentScoreColor(score: number): string {
  if (score >= 70) return '#10B981'; // Green
  if (score >= 60) return '#fbbf24'; // Yellow
  if (score >= 40) return '#666666'; // Gray
  if (score >= 30) return '#f97316'; // Orange
  return '#EF4444'; // Red
}

/**
 * Format decision entry for display
 */
export function formatDecisionEntry(
  entry: DecisionLogEntry
): Record<string, any> {
  const timestamp = new Date(entry.timestamp).toLocaleString();
  const signal = `${entry.type.toUpperCase()} ${entry.symbol} ${entry.timeframe}`;

  return {
    id: entry.id,
    timestamp,
    signal,
    outcome: entry.consensus.outcome,
    approvalRate: `${entry.consensus.approvalCount}/${entry.consensus.agentScores.length}`,
    confidence: `${entry.consensus.overallConfidence.toFixed(0)}%`,
    reason: entry.reason,
    alertCreated: entry.alertCreated || 'N/A',
  };
}

/**
 * Generate consensus report (text)
 */
export function generateConsensusReport(
  symbol: string,
  agentScores: AgentScore[],
  outcome: string
): string {
  const approvals = agentScores.filter((a) => a.score >= 60).length;
  const rejections = agentScores.filter((a) => a.score < 40).length;
  const avgScore = (
    agentScores.reduce((s, a) => s + a.score, 0) / agentScores.length
  ).toFixed(1);
  const avgConfidence = (
    agentScores.reduce((s, a) => s + a.confidence, 0) / agentScores.length
  ).toFixed(1);

  let report = `\n╔════════════════════════════════════════╗\n`;
  report += `║ ${symbol} - CONSENSUS ANALYSIS\n`;
  report += `╚════════════════════════════════════════╝\n\n`;

  report += `Outcome: ${outcome.toUpperCase()}\n`;
  report += `Approvals: ${approvals}/11 | Rejections: ${rejections}/11\n`;
  report += `Average Score: ${avgScore}/100\n`;
  report += `Average Confidence: ${avgConfidence}%\n\n`;

  report += `Agent Breakdown:\n`;
  agentScores.forEach((agent) => {
    const status = agent.score >= 60 ? '✓' : agent.score < 40 ? '✗' : '◐';
    report += `  ${status} ${agent.agent}: ${agent.score.toFixed(
      0
    )}/100 (${agent.confidence.toFixed(0)}% confidence)\n`;
  });

  report += `\nReasons:\n`;
  agentScores.forEach((agent) => {
    report += `  - ${agent.agent}: ${agent.reasoning}\n`;
  });

  return report;
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(
  successfulTrades: number,
  failedTrades: number
): {
  winRate: number;
  totalTrades: number;
  riskRewardAvg: number;
} {
  const totalTrades = successfulTrades + failedTrades;
  const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

  return {
    winRate: parseFloat(winRate.toFixed(2)),
    totalTrades,
    riskRewardAvg: 1.8, // Demo value
  };
}

/**
 * Filter decision log
 */
export function filterDecisionLog(
  log: DecisionLogEntry[],
  filters: {
    symbol?: string;
    outcome?: 'approved' | 'rejected' | 'pending';
    startTime?: number;
    endTime?: number;
  }
): DecisionLogEntry[] {
  return log.filter((entry) => {
    if (filters.symbol && entry.symbol !== filters.symbol) return false;
    if (filters.outcome && entry.consensus.outcome !== filters.outcome)
      return false;
    if (
      filters.startTime &&
      entry.timestamp < filters.startTime
    )
      return false;
    if (
      filters.endTime &&
      entry.timestamp > filters.endTime
    )
      return false;
    return true;
  });
}

/**
 * Export decision log as CSV
 */
export function exportDecisionLogAsCSV(log: DecisionLogEntry[]): string {
  let csv = 'Timestamp,Symbol,Type,Timeframe,Outcome,ApprovalCount,Confidence,AlertCreated\n';

  log.forEach((entry) => {
    const timestamp = new Date(entry.timestamp).toISOString();
    csv += `"${timestamp}","${entry.symbol}","${entry.type}","${entry.timeframe}","${
      entry.consensus.outcome
    }","${entry.consensus.approvalCount}/${entry.consensus.agentScores.length}","${entry.consensus.overallConfidence.toFixed(
      1
    )}","${entry.alertCreated || 'N/A'}"\n`;
  });

  return csv;
}

/**
 * Get status summary
 */
export function getEngineStatusSummary(
  metrics: EngineMetrics
): Record<string, string | number> {
  return {
    totalAlerts: metrics.totalAlertsGenerated,
    activeAlerts: metrics.activeAlerts,
    closedAlerts: metrics.closedAlerts,
    successful: metrics.successfulTrades,
    failed: metrics.failedTrades,
    winRate: `${metrics.averageWinRate.toFixed(1)}%`,
    consensusApprovalRate: `${metrics.consensusApprovalRate.toFixed(1)}%`,
    averageRiskReward: metrics.averageRiskReward.toFixed(2),
    lastUpdate: new Date(metrics.lastDecisionTime).toLocaleString(),
  };
}

