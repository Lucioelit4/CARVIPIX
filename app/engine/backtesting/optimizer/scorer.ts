/**
 * Scoring System para Parameter Optimizer
 * Calcula scores complejos considerando múltiples métricas y penalizaciones
 */

import { BacktestMetrics } from '../../types/backtesting';
import { OptimizationScore } from './types';

export class OptimizationScorer {
  /**
   * Calcular score final para una configuración
   */
  static calculateScore(
    metrics: BacktestMetrics,
    overfitDetected: boolean,
    overfitSeverity: 'none' | 'low' | 'medium' | 'high',
    walkForwardConsistency: number = 100,
    monteCarloConfidence: number = 100
  ): OptimizationScore {
    // 1. Profit Factor Score (0-100)
    const profitFactorScore = this.scoreProfitFactor(metrics.profitFactor);

    // 2. Win Rate Score (0-100)
    const winRateScore = this.scoreWinRate(metrics.winRate);

    // 3. Drawdown Penalty (-0 a -100)
    const drawdownPenalty = this.penalizeDrawdown(metrics.maxDrawdown);

    // 4. Trade Count Penalty (-0 a -50)
    const tradeCountPenalty = this.penalizeTradeCount(metrics.totalTrades);

    // 5. Overfit Penalty (-0 a -50)
    const overfitPenalty = this.penalizeOverfit(overfitDetected, overfitSeverity);

    // 6. Stability Bonus (0-20)
    const stabilityBonus = this.bonusStability(metrics);

    // 7. Walk-forward Consistency (0-100, si aplica)
    const wfConsistencyScore = Math.min(100, Math.max(0, walkForwardConsistency));

    // 8. Monte Carlo Confidence (0-100, si aplica)
    const mcConfidenceScore = Math.min(100, Math.max(0, monteCarloConfidence));

    // Componentes principales
    const mainComponents = [
      profitFactorScore * 0.25,
      winRateScore * 0.20,
      drawdownPenalty,
      tradeCountPenalty,
      overfitPenalty,
      stabilityBonus,
      wfConsistencyScore * 0.15,
      mcConfidenceScore * 0.10,
    ];

    const finalScore = Math.max(0, Math.min(100, mainComponents.reduce((a, b) => a + b, 0)));

    return {
      profitFactor: profitFactorScore,
      winRate: winRateScore,
      drawdownPenalty,
      tradeCountPenalty,
      overfitPenalty,
      stabilityBonus,
      walkForwardConsistency: wfConsistencyScore,
      monteCarloConfidence: mcConfidenceScore,
      final: finalScore,
    };
  }

  /**
   * Scoring: Profit Factor (0-100)
   */
  private static scoreProfitFactor(profitFactor: number): number {
    // PF < 1.0 = 0 (losing)
    // PF 1.0 = 10
    // PF 1.5 = 25
    // PF 2.0 = 50
    // PF 3.0 = 75
    // PF >= 4.0 = 100
    if (profitFactor < 1.0) return 0;
    if (profitFactor >= 4.0) return 100;
    return (profitFactor - 1.0) * 33.33; // Escala lineal 1.0-4.0 → 0-100
  }

  /**
   * Scoring: Win Rate (0-100)
   */
  private static scoreWinRate(winRate: number): number {
    // WR < 40% = 0
    // WR 40% = 5
    // WR 50% = 30
    // WR 60% = 60
    // WR >= 70% = 100
    if (winRate < 40) return 0;
    if (winRate >= 70) return 100;
    return (winRate - 40) * 3.33; // Escala lineal 40-70 → 0-100
  }

  /**
   * Penalización: Drawdown Máximo (-0 a -100)
   */
  private static penalizeDrawdown(maxDrawdown: number): number {
    // Drawdown <= 10% = 0 (sin penalización)
    // Drawdown 15% = -20
    // Drawdown 20% = -50
    // Drawdown 30% = -100 (penalización máxima)
    if (maxDrawdown <= 10) return 0;
    if (maxDrawdown >= 30) return -100;
    return -((maxDrawdown - 10) / 20) * 100; // Escala 10-30 → 0 a -100
  }

  /**
   * Penalización: Cantidad de Trades (-0 a -50)
   */
  private static penalizeTradeCount(totalTrades: number): number {
    // < 20 trades = -50 (muestra insuficiente)
    // 20-50 trades = escala gradual
    // >= 100 trades = 0 (sin penalización)
    if (totalTrades >= 100) return 0;
    if (totalTrades < 20) return -50;
    return -((100 - totalTrades) / 80) * 50; // Escala 20-100 → -50 a 0
  }

  /**
   * Penalización: Sobreajuste (-0 a -50)
   */
  private static penalizeOverfit(detected: boolean, severity: string): number {
    if (!detected) return 0;
    const severityMap: Record<string, number> = {
      none: 0,
      low: -10,
      medium: -25,
      high: -50,
    };
    return severityMap[severity] || 0;
  }

  /**
   * Bonus: Estabilidad (+0 a +20)
   */
  private static bonusStability(metrics: BacktestMetrics): number {
    let bonus = 0;

    // Bonus: Baja variancia en win rate
    // (comparar max/min consecutive wins-losses)
    if (metrics.maxConsecutiveWins <= 5 && metrics.maxConsecutiveLosses <= 4) {
      bonus += 10;
    }

    // Bonus: Ratio RR consistente
    if (metrics.averageRiskReward >= 1.8 && metrics.averageRiskReward <= 2.5) {
      bonus += 5;
    }

    // Bonus: Sharpe Ratio sólido
    if (metrics.sharpeRatio >= 1.5) {
      bonus += 5;
    }

    return Math.min(20, bonus);
  }

  /**
   * Comparar dos scores
   */
  static compareScores(score1: OptimizationScore, score2: OptimizationScore): number {
    return score2.final - score1.final; // Descendente (mejor primero)
  }

  /**
   * Generar descripción legible de score
   */
  static describeScore(score: OptimizationScore): string {
    const parts: string[] = [];

    if (score.profitFactor > 60) parts.push('✓ Excelente profit factor');
    if (score.winRate > 60) parts.push('✓ Win rate sólido');
    if (score.drawdownPenalty > -30) parts.push('✓ Drawdown controlado');
    if (score.stabilityBonus > 15) parts.push('✓ Muy estable');
    if (score.overfitPenalty < -25) parts.push('⚠️ Posible sobreajuste');
    if (score.tradeCountPenalty < -20) parts.push('⚠️ Pocas operaciones');

    if (score.final >= 80) return `Excelente (${score.final.toFixed(0)}/100): ${parts.join(', ')}`;
    if (score.final >= 60) return `Bueno (${score.final.toFixed(0)}/100): ${parts.join(', ')}`;
    if (score.final >= 40) return `Aceptable (${score.final.toFixed(0)}/100): ${parts.join(', ')}`;
    return `Pobre (${score.final.toFixed(0)}/100): Revisar parámetros`;
  }
}
