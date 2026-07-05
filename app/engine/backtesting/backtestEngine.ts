/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Motor privado de backtesting para CARVIPIX Bot
 * Simula ejecución de estrategia con datos históricos
 * Uso exclusivo: Admin panel privado
 * No exponer resultados al cliente
 */

import { Asset, Timeframe, Candle, MarketData } from '../types/marketData';
import { AgentScore } from '../types/index';
import {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  BacktestStatus,
  BacktestMetrics,
  BacktestError,
  BacktestWarning,
  BacktestReport,
  SignalDiagnostics,
} from '../types/backtesting';
import {
  analyzeMarketRegime,
  analyzeTrend,
  analyzeStructure,
  analyzeMomentum,
  analyzePullback,
  analyzeSession,
  analyzeNews,
  analyzeRisk,
  scoreConfidence,
  validateTrade,
  learnFromHistory,
} from '../agents/index';
import { calculateBacktestMetrics } from './calculations';
import { PerformanceTracker } from './performance';

/**
 * Motor de backtesting privado
 */
export class BacktestEngine {
  private config: BacktestConfig;
  private trades: BacktestTrade[] = [];
  private errors: BacktestError[] = [];
  private warnings: BacktestWarning[] = [];
  private status: BacktestStatus;
  private currentBalance: number = 0;
  private balanceHistory: number[] = [];
  private candles: Candle[] = [];
  private activeTrades: Map<string, BacktestTrade> = new Map();
  private performanceTracker: PerformanceTracker;
  private isShortSample: boolean = false; // Flag para samples cortos
  private adjustedConsensusThreshold: number = 0; // Threshold ajustado para samples cortos

  // Diagnóstico de señales
  private diagnostics = {
    candlesEvaluated: 0,
    candidateSignals: 0,
    rejectionReasons: {} as Record<string, number>,
    allScores: [] as number[],
    agentStats: {} as Record<string, { approved: number; rejected: number; scores: number[] }>,
    consensus9Trades: 0,
    consensus8Trades: 0,
    consensus7Trades: 0,
  };

  constructor(config: BacktestConfig) {
    this.config = config;
    this.currentBalance = config.initialBalance;
    this.performanceTracker = new PerformanceTracker();
    this.status = {
      id: config.id,
      status: 'pending',
      progress: 0,
      currentCandle: 0,
      totalCandles: 0,
      tradesProcessed: 0,
      startTime: Date.now(),
      estimatedTimeRemaining: 0,
      currentBalance: config.initialBalance,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Iniciar backtesting
   */
  async run(historicalCandles: Candle[]): Promise<BacktestResult> {
    this.status.status = 'running';
    this.status.startTime = Date.now();
    this.candles = historicalCandles;
    this.status.totalCandles = historicalCandles.length;

    // Detectar si es un sample corto (< 100 candles)
    this.isShortSample = historicalCandles.length < 100;
    // Ajustar consenso para samples cortos: reducir de 7 a 5 agentes mínimo
    this.adjustedConsensusThreshold = this.isShortSample ? Math.max(5, this.config.consensusThreshold - 2) : this.config.consensusThreshold;

    try {
      // Validar datos
      this.validateHistoricalData(historicalCandles);

      // Procesar cada vela
      for (let i = 0; i < historicalCandles.length; i++) {
        const candle = historicalCandles[i];

        // Actualizar progreso
        this.status.currentCandle = i;
        this.status.progress = Math.round((i / historicalCandles.length) * 100);
        this.status.lastUpdate = Date.now();

        // Verificar trades abiertos contra cierre actual
        this.checkActiveTrades(candle);

        // Procesar cierre de vela después de actualizar posiciones abiertas
        // para evitar lookahead bias con el high/low de la misma vela.
        await this.processCandle(candle, i);
      }

      // Cerrar trades abiertos al final
      this.closePendingTrades();

      // Calcular métricas finales
      const metrics = calculateBacktestMetrics(
        this.trades,
        this.config.initialBalance,
        this.balanceHistory
      );

      // Compilar diagnósticos
      const diagnostics = this.compileDiagnostics();

      // Generar reporte
      const result: BacktestResult = {
        id: this.config.id,
        config: this.config,
        trades: this.trades,
        metrics,
        status: this.errors.filter((e) => e.severity === 'critical').length > 0 ? 'failed' : 'success',
        errors: this.errors,
        warnings: this.warnings,
        completedAt: Date.now(),
        duration: Date.now() - this.status.startTime,
        diagnostics,
      };

      this.status.status = 'completed';
      return result;
    } catch (error) {
      this.status.status = 'failed';
      this.errors.push({
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : 'Error desconocido en backtesting',
        type: 'logic_error',
        severity: 'critical',
      });

      return {
        id: this.config.id,
        config: this.config,
        trades: this.trades,
        metrics: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          lossRate: 0,
          totalProfit: 0,
          totalLoss: 0,
          netProfit: 0,
          grossProfit: 0,
          profitFactor: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          maxDrawdown: 0,
          drawdownDuration: 0,
          currentDrawdown: 0,
          maxConsecutiveWins: 0,
          maxConsecutiveLosses: 0,
          averageRiskReward: 0,
          sharpeRatio: 0,
          sortinoRatio: 0,
          profitability: 0,
          expectancy: 0,
          expectancyPercent: 0,
          finalBalance: this.currentBalance,
          balanceGrowth: 0,
          returnOnInitialCapital: 0,
          averageConsensusScore: 0,
          consensusApprovalRate: 0,
          rejectedSignals: 0,
          totalSignalsProcessed: 0,
          avgWinSize: 0,
          avgLossSize: 0,
          payoffIndex: 0,
          recoveryFactor: 0,
          riskPerTradeCapital: 0,
          tradesWithValidSL: 0,
          tradesWithValidTP: 0,
          tradesWithProperRiskRatio: 0,
        },
        status: 'failed',
        errors: this.errors,
        warnings: this.warnings,
        completedAt: Date.now(),
        duration: Date.now() - this.status.startTime,
      };
    }
  }

  /**
   * Procesar cierre de vela
   */
  private async processCandle(candle: Candle, index: number): Promise<void> {
    try {
      // Solo procesar velas completas
      if (!candle.complete) return;

      // Contar vela evaluada
      this.diagnostics.candlesEvaluated++;

      // Simular indicadores técnicos
      const indicators = this.simulateIndicators(index);

      // Ejecutar 11 agentes
      const agentScores = this.runAgents(candle, indicators);

      // Registrar scores para diagnóstico
      agentScores.forEach((score) => {
        this.diagnostics.allScores.push(score.score);
        if (!this.diagnostics.agentStats[score.agent]) {
          this.diagnostics.agentStats[score.agent] = { approved: 0, rejected: 0, scores: [] };
        }
        this.diagnostics.agentStats[score.agent].scores.push(score.score);
      });

      // Evaluar consenso y registrar razones de rechazo
      const consensus = this.evaluateConsensus(agentScores);

      // Contar candidato inicial
      this.diagnostics.candidateSignals++;

      // Simular aprobación/rechazo por umbral
      const scoreThreshold = this.isShortSample ? 50 : 60;
      agentScores.forEach((score) => {
        if (score.score >= scoreThreshold) {
          this.diagnostics.agentStats[score.agent].approved++;
        } else {
          this.diagnostics.agentStats[score.agent].rejected++;
          if (!this.diagnostics.rejectionReasons[score.agent]) {
            this.diagnostics.rejectionReasons[score.agent] = 0;
          }
          this.diagnostics.rejectionReasons[score.agent]++;
        }
      });

      // Simular consensos 9, 8, 7
      const approvalCount = agentScores.filter((s) => s.score >= scoreThreshold).length;
      if (approvalCount >= 9) this.diagnostics.consensus9Trades++;
      if (approvalCount >= 8) this.diagnostics.consensus8Trades++;
      if (approvalCount >= 7) this.diagnostics.consensus7Trades++;

      // Si consenso rechazado, registrar razón
      if (!consensus.approved) {
        const reason = `Consenso insuficiente (${approvalCount}/${this.adjustedConsensusThreshold})`;
        if (!this.diagnostics.rejectionReasons[reason]) {
          this.diagnostics.rejectionReasons[reason] = 0;
        }
        this.diagnostics.rejectionReasons[reason]++;
      }

      // Si consenso aprobado y no hay operaciones abiertas
      let tradesGenerated = 0;
      if (consensus.approved && this.activeTrades.size === 0) {
        // Generar señal de entrada
        this.processEntrySignal(candle, agentScores, consensus.averageScore);
        tradesGenerated = 1;
      }

      // Registrar rendimiento
      this.performanceTracker.recordCandleProcessed(
        candle.asset,
        candle.timeframe,
        agentScores.length, // agent calls
        true, // consensus evaluated
        consensus.approved, // consensus approved
        tradesGenerated
      );

      // Registrar en historial
      this.status.tradesProcessed++;
    } catch (error) {
      this.errors.push({
        timestamp: Date.now(),
        candle: index,
        message: error instanceof Error ? error.message : 'Error procesando vela',
        type: 'data_error',
        severity: 'warning',
      });
    }
  }

  /**
   * Ejecutar los 11 agentes
   */
  private runAgents(
    candle: Candle,
    indicators: any
  ): AgentScore[] {
    const scores: AgentScore[] = [];

    try {
      const support = indicators.support || candle.low;
      const resistance = indicators.resistance || candle.high;
      const currentDrawdown = this.getCurrentDrawdown();

      // 1. Market Regime Analyst
      const regimeResult = analyzeMarketRegime({
        symbol: candle.asset,
        atr: indicators.atr || 50,
        volatility: indicators.volatility || 30,
        trend: indicators.trend || 'neutral',
      });
      scores.push(regimeResult);

      // 2. Trend Analyst
      const trendResult = analyzeTrend({
        symbol: candle.asset,
        ema20: indicators.ema20 || candle.close,
        ema50: indicators.ema50 || candle.close,
        ema200: indicators.ema200 || candle.close,
        price: candle.close,
        direction: indicators.direction === 'down' ? 'down' : 'up',
      });
      scores.push(trendResult);

      // 3. Structure Analyst
      const structureResult = analyzeStructure({
        symbol: candle.asset,
        price: candle.close,
        resistance,
        support,
        breakout: Boolean(indicators.breakout),
      });
      scores.push(structureResult);

      // 4. Momentum Analyst
      const momentumResult = analyzeMomentum({
        symbol: candle.asset,
        rsi: indicators.rsi || 50,
        macdHistogram: indicators.macd || 0,
        momentum: indicators.momentum || 'neutral',
      });
      scores.push(momentumResult);

      // 5. Pullback Analyst
      const pullbackResult = analyzePullback({
        symbol: candle.asset.toString(),
        isPullback: Boolean(indicators.isPullback),
        pullbackDepth: indicators.pullbackDepth || 0,
        pullbackNormalized: indicators.pullbackNormalized || 0,
        trend: indicators.direction || 'none',
        trendStrength: indicators.trendStrength || 0,
        recoveryFromPullback: indicators.recoveryFromPullback || 0,
      });
      scores.push(pullbackResult);

      // 6. Session Analyst
      const hour = new Date(candle.timestamp).getUTCHours();
      let currentSession: 'asian' | 'european' | 'us' | 'overlap' = 'asian';
      if (hour >= 8 && hour < 12) currentSession = 'european';
      else if (hour >= 13 && hour < 21) currentSession = 'us';
      else if ((hour >= 7 && hour < 9) || (hour >= 12 && hour < 14)) currentSession = 'overlap';

      const sessionResult = analyzeSession({
        symbol: candle.asset,
        currentSession,
        sessionStart: candle.timestamp,
        sessionEnd: candle.timestamp + 3600000,
      });
      scores.push(sessionResult);

      // 7. News Analyst
      const newsResult = analyzeNews({
        symbol: candle.asset,
        hasMajorNews: Boolean(indicators.hasMajorNews),
        newsImpact: indicators.newsImpact || 'neutral',
        volatilityExpected: Boolean(indicators.volatilityExpected),
      });
      scores.push(newsResult);

      // 8. Risk Manager
      const stopLoss = indicators.stopLoss || candle.low * 0.99;
      const takeProfit = indicators.takeProfit || candle.high * 1.01;
      const riskResult = analyzeRisk({
        symbol: candle.asset.toString(),
        entryPrice: candle.close,
        stopLossPrice: stopLoss,
        takeProfitPrice: takeProfit,
        accountRisk: this.config.riskPerTrade,
        spreadEstimated: this.config.includeSlippage ? this.config.slippagePoints : 0,
        volatility: indicators.atr || 0,
        currentDrawdown,
        maxAllowedDrawdown: this.config.maxDrawdown,
      });
      scores.push(riskResult);

      // 10. Trade Validator (antes de Confidence para tener todos los scores)
      const validatorResult = validateTrade({
        symbol: candle.asset,
        hasAllRequiredData: true,
        noFundamentalEvents: true,
        priceActionClean: true,
        entrySureAdjustment: 0,
      });
      scores.push(validatorResult);

      // 11. Learning Engine
      const learningResult = learnFromHistory({
        winRate: this.trades.length > 0
          ? (this.trades.filter((trade) => trade.isWinning).length / this.trades.length) * 100
          : 50,
        totalTrades: this.trades.length,
        profitFactor: this.getCurrentProfitFactor(),
        recentPerformance: this.getRecentPerformanceTrend(),
      });
      scores.push(learningResult);

      // 9. Confidence Scoring (DESPUÉS de todos los agentes para calcular agreement real)
      const confidenceResult = scoreConfidence({
        allAgentScores: scores, // Todos los scores incluidos
        dataQuality: 'high',
        marketConditions: 'normal',
        timeframe: this.config.timeframe,
      });
      scores.push(confidenceResult);
    } catch (error) {
      this.warnings.push({
        timestamp: Date.now(),
        message: `Error ejecutando agentes: ${error instanceof Error ? error.message : 'error desconocido'}`,
        type: 'unusual_pattern',
        severity: 'warning',
      });
    }

    return scores;
  }

  /**
   * Evaluar consenso (9/11)
   */
  private evaluateConsensus(agentScores: AgentScore[]): {
    approved: boolean;
    averageScore: number;
    approvalCount: number;
  } {
    if (agentScores.length === 0) {
      return { approved: false, averageScore: 0, approvalCount: 0 };
    }

    // Para samples cortos, ser más permisivo con los scores (50 en lugar de 60)
    const scoreThreshold = this.isShortSample ? 50 : 60;
    const approvalCount = agentScores.filter((s) => s.score >= scoreThreshold).length;
    const averageScore = agentScores.reduce((sum, s) => sum + s.score, 0) / agentScores.length;
    const approved = approvalCount >= this.adjustedConsensusThreshold;

    return { approved, averageScore, approvalCount };
  }

  /**
   * Procesar señal de entrada
   */
  private processEntrySignal(
    candle: Candle,
    agentScores: any[],
    consensusScore: number
  ): void {
    try {
      const riskAmount = (this.currentBalance * this.config.riskPerTrade) / 100;
      const direction: 'long' | 'short' = candle.close >= candle.open ? 'long' : 'short';
      const stopLoss = direction === 'long' ? candle.low * 0.99 : candle.high * 1.01;
      const takeProfit = direction === 'long' ? candle.high * 1.01 : candle.low * 0.99;
      const riskDistance = Math.abs(candle.close - stopLoss);
      const rewardDistance = Math.abs(takeProfit - candle.close);
      const riskReward = riskDistance > 0 ? rewardDistance / riskDistance : 0;

      // Validar RR - ser más permisivo con samples cortos
      const minRR = this.isShortSample ? 1.0 : 1.5;
      if (riskReward < minRR) {
        this.warnings.push({
          timestamp: Date.now(),
          message: `RR bajo (${riskReward.toFixed(2)}): ${candle.asset}`,
          type: 'unusual_pattern',
          severity: 'info',
        });
        return;
      }

      const trade: BacktestTrade = {
        id: `trade_${Date.now()}_${Math.random()}`,
        entryTime: candle.timestamp,
        entryPrice: candle.close,
        entryReason: `Consenso ${consensusScore.toFixed(0)}/100 - 11 agentes aprobados`,
        direction,
        quantity: riskDistance > 0 ? riskAmount / riskDistance : 0,
        stopLoss,
        takeProfit,
        riskReward,
        pips: 0,
        profit: 0,
        profitPercent: 0,
        isWinning: false,
        status: 'open',
        agentScores: agentScores.map((s) => ({ agent: s.agent, score: s.score })),
        consensusScore,
        slippage: this.config.includeSlippage ? this.config.slippagePoints : 0,
      };

      this.activeTrades.set(trade.id, trade);
    } catch (error) {
      this.errors.push({
        timestamp: Date.now(),
        message: `Error procesando entrada: ${error instanceof Error ? error.message : 'error desconocido'}`,
        type: 'logic_error',
        severity: 'warning',
      });
    }
  }

  /**
   * Verificar trades abiertos contra cierre actual
   */
  private checkActiveTrades(candle: Candle): void {
    this.activeTrades.forEach((trade, tradeId) => {
      try {
        if (trade.direction === 'long') {
          // Check TP
          if (candle.high >= trade.takeProfit) {
            this.closeTrade(tradeId, trade.takeProfit, 'tp_hit', candle.timestamp);
            return;
          }
          // Check SL
          if (candle.low <= trade.stopLoss) {
            this.closeTrade(tradeId, trade.stopLoss, 'stopped', candle.timestamp);
            return;
          }
        } else {
          // Short
          if (candle.low <= trade.takeProfit) {
            this.closeTrade(tradeId, trade.takeProfit, 'tp_hit', candle.timestamp);
            return;
          }
          if (candle.high >= trade.stopLoss) {
            this.closeTrade(tradeId, trade.stopLoss, 'stopped', candle.timestamp);
            return;
          }
        }
      } catch (error) {
        this.errors.push({
          timestamp: Date.now(),
          message: `Error verificando trade: ${error instanceof Error ? error.message : 'error desconocido'}`,
          type: 'calculation_error',
          severity: 'warning',
        });
      }
    });
  }

  /**
   * Cerrar trade
   */
  private closeTrade(tradeId: string, exitPrice: number, reason: string, exitTime: number): void {
    const trade = this.activeTrades.get(tradeId);
    if (!trade) return;

    trade.exitTime = exitTime;
    trade.exitPrice = exitPrice;
    trade.exitReason = reason;
    trade.status = reason === 'tp_hit' ? 'tp_hit' : reason === 'stopped' ? 'stopped' : 'closed';

    // Calcular P&L
    let profit = 0;
    if (trade.direction === 'long') {
      profit = (exitPrice - trade.entryPrice) * trade.quantity;
    } else {
      profit = (trade.entryPrice - exitPrice) * trade.quantity;
    }

    trade.profit = profit;
    trade.profitPercent = (profit / this.currentBalance) * 100;
    trade.isWinning = profit > 0;
    trade.pips = Math.abs((exitPrice - trade.entryPrice) * 10000);

    // Actualizar balance
    this.currentBalance += profit;
    this.balanceHistory.push(this.currentBalance);

    // Registrar trade
    this.trades.push(trade);
    this.activeTrades.delete(tradeId);
  }

  /**
   * Cerrar trades pendientes al final
   */
  private closePendingTrades(): void {
    const lastCandle = this.candles[this.candles.length - 1];
    if (!lastCandle) return;

    this.activeTrades.forEach((trade, tradeId) => {
      this.closeTrade(tradeId, lastCandle.close, 'closed_at_end', lastCandle.timestamp);
    });
  }

  /**
   * Validar datos históricos
   */
  private validateHistoricalData(candles: Candle[]): void {
    if (candles.length === 0) {
      throw new Error('No hay datos históricos para backtesting');
    }

    // Advertencia para samples cortos
    if (this.isShortSample) {
      this.warnings.push({
        timestamp: Date.now(),
        message: `Sample corto detectado: ${candles.length} candles. Solo válido para prueba visual y demostración. Resultados no validados en datos históricos reales.`,
        type: 'short_sample_warning',
        severity: 'info',
      });
    }

    let issues = 0;
    candles.forEach((candle, index) => {
      if (candle.high < candle.low) {
        issues++;
        this.warnings.push({
          timestamp: Date.now(),
          message: `Vela ${index}: High < Low`,
          type: 'low_data_quality',
          severity: 'warning',
        });
      }
      if (candle.close < candle.low || candle.close > candle.high) {
        issues++;
      }
    });

    if (issues > candles.length * 0.05) {
      this.warnings.push({
        timestamp: Date.now(),
        message: `Datos históricos con calidad baja: ${((issues / candles.length) * 100).toFixed(1)}% anomalías`,
        type: 'low_data_quality',
        severity: 'warning',
      });
    }
  }

  /**
   * Compilar diagnósticos de señales
   */
  private compileDiagnostics() {
    // Calcular distribución de scores
    const distribution: Record<number, number> = {};
    this.diagnostics.allScores.forEach((score) => {
      const roundedScore = Math.round(score / 10) * 10;
      distribution[roundedScore] = (distribution[roundedScore] || 0) + 1;
    });

    // Ordenar rechazos por count
    const sortedRejections = Object.entries(this.diagnostics.rejectionReasons)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / Math.max(1, this.diagnostics.candidateSignals)) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Compilar estadísticas de agentes
    const agentStats: Record<string, { approved: number; rejected: number; avgScore: number }> = {};
    Object.entries(this.diagnostics.agentStats).forEach(([agent, stats]) => {
      agentStats[agent] = {
        approved: stats.approved,
        rejected: stats.rejected,
        avgScore: stats.scores.length > 0 ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : 0,
      };
    });

    const diagnostics: SignalDiagnostics = {
      candlesEvaluated: this.diagnostics.candlesEvaluated,
      candidateSignals: this.diagnostics.candidateSignals,
      rejectionReasons: this.diagnostics.rejectionReasons,
      top5Rejections: sortedRejections,
      scoreDistribution: {
        min: Math.min(...this.diagnostics.allScores, 0),
        max: Math.max(...this.diagnostics.allScores, 0),
        average: this.diagnostics.allScores.length > 0
          ? this.diagnostics.allScores.reduce((a, b) => a + b, 0) / this.diagnostics.allScores.length
          : 0,
        distribution,
      },
      agentStats,
      consensusComparison: {
        consensus9: this.diagnostics.consensus9Trades,
        consensus8: this.diagnostics.consensus8Trades,
        consensus7: this.diagnostics.consensus7Trades,
      },
    };

    return diagnostics;
  }

  /**
   * Simular indicadores técnicos
   */
  private simulateIndicators(index: number): any {
    const ema20 = this.calculateEMA(index, 20);
    const ema50 = this.calculateEMA(index, 50);
    const ema200 = this.calculateEMA(index, 200);
    const atr = this.calculateATR(index, 14);
    const rsi = this.calculateRSI(index, 14);
    const macd = this.calculateMACD(index);
    const volatility = this.calculateVolatility(index, 20);
    const currentCandle = this.candles[index];
    const recentWindow = this.candles.slice(Math.max(0, index - 20), index + 1);
    const support = recentWindow.length > 0 ? Math.min(...recentWindow.map((candle) => candle.low)) : currentCandle?.low || 0;
    const resistance = recentWindow.length > 0 ? Math.max(...recentWindow.map((candle) => candle.high)) : currentCandle?.high || 0;
    const trend = ema20 > ema50 && ema50 > ema200
      ? 'strong_up'
      : ema20 < ema50 && ema50 < ema200
        ? 'strong_down'
        : Math.abs(ema20 - ema50) / Math.max(currentCandle?.close || 1, 1) < 0.001
          ? 'choppy'
          : 'neutral';
    const direction = trend === 'strong_down' ? 'down' : trend === 'strong_up' ? 'up' : currentCandle?.close >= ema50 ? 'up' : 'down';
    const pullbackDepth = direction === 'up'
      ? Math.max(0, resistance - (currentCandle?.close || 0))
      : Math.max(0, (currentCandle?.close || 0) - support);
    const pullbackNormalized = atr > 0 ? pullbackDepth / atr : 0;
    const trendStrength = Math.min(100, (Math.abs(ema20 - ema200) / Math.max(currentCandle?.close || 1, 1)) * 10000);
    const momentum = macd > 0.2 && rsi > 55
      ? 'strong_bullish'
      : macd > 0 && rsi >= 50
        ? 'bullish'
        : macd < -0.2 && rsi < 45
          ? 'strong_bearish'
          : macd < 0 && rsi < 50
            ? 'bearish'
            : 'neutral';
    const stopLoss = direction === 'up'
      ? (currentCandle?.close || 0) - atr * 1.2
      : (currentCandle?.close || 0) + atr * 1.2;
    const takeProfit = direction === 'up'
      ? (currentCandle?.close || 0) + atr * 2
      : (currentCandle?.close || 0) - atr * 2;
    const hour = new Date(currentCandle?.timestamp || 0).getUTCHours();

    return {
      ema20,
      ema50,
      ema200,
      rsi,
      atr,
      volatility,
      macd,
      trend,
      direction,
      support,
      resistance,
      breakout: direction === 'up' ? (currentCandle?.close || 0) >= resistance * 0.998 : (currentCandle?.close || 0) <= support * 1.002,
      trendStrength,
      pullbackDepth,
      pullbackNormalized,
      recoveryFromPullback: pullbackNormalized > 0 ? Math.max(0, 100 - pullbackNormalized * 50) : 100,
      isPullback: pullbackNormalized > 0.2 && pullbackNormalized < 1.25,
      momentum,
      stopLoss,
      takeProfit,
      hasMajorNews: hour === 13 || hour === 14,
      newsImpact: volatility > 2 ? 'negative' : 'neutral',
      volatilityExpected: volatility > 2,
    };
  }

  private calculateEMA(index: number, period: number): number {
    const start = Math.max(0, index - period * 3);
    const slice = this.candles.slice(start, index + 1);
    if (slice.length === 0) return 0;

    const multiplier = 2 / (period + 1);
    let ema = slice[0].close;

    for (let i = 1; i < slice.length; i++) {
      ema = slice[i].close * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  private calculateATR(index: number, period: number): number {
    const start = Math.max(1, index - period + 1);
    const slice = this.candles.slice(start, index + 1);
    if (slice.length === 0) return 0;

    const trueRanges = slice.map((candle, offset) => {
      const previousClose = this.candles[start + offset - 1]?.close ?? candle.close;
      return Math.max(
        candle.high - candle.low,
        Math.abs(candle.high - previousClose),
        Math.abs(candle.low - previousClose)
      );
    });

    return trueRanges.reduce((sum, value) => sum + value, 0) / trueRanges.length;
  }

  private calculateRSI(index: number, period: number): number {
    if (index <= 0) return 50;

    const start = Math.max(1, index - period + 1);
    let gains = 0;
    let losses = 0;

    for (let i = start; i <= index; i++) {
      const delta = this.candles[i].close - this.candles[i - 1].close;
      if (delta >= 0) {
        gains += delta;
      } else {
        losses += Math.abs(delta);
      }
    }

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(index: number): number {
    return this.calculateEMA(index, 12) - this.calculateEMA(index, 26);
  }

  private calculateVolatility(index: number, period: number): number {
    const start = Math.max(1, index - period + 1);
    const returns: number[] = [];

    for (let i = start; i <= index; i++) {
      const previousClose = this.candles[i - 1]?.close;
      if (!previousClose) continue;
      returns.push((this.candles[i].close - previousClose) / previousClose);
    }

    if (returns.length === 0) return 0;
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
  }

  private getCurrentProfitFactor(): number {
    const winningProfit = this.trades
      .filter((trade) => trade.isWinning)
      .reduce((sum, trade) => sum + trade.profit, 0);
    const losingProfit = this.trades
      .filter((trade) => !trade.isWinning)
      .reduce((sum, trade) => sum + Math.abs(trade.profit), 0);

    if (losingProfit === 0) {
      return winningProfit > 0 ? 999 : 0;
    }

    return winningProfit / losingProfit;
  }

  private getRecentPerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.trades.length < 6) return 'stable';

    const recentTrades = this.trades.slice(-6);
    const firstHalf = recentTrades.slice(0, 3).reduce((sum, trade) => sum + trade.profit, 0);
    const secondHalf = recentTrades.slice(3).reduce((sum, trade) => sum + trade.profit, 0);

    if (secondHalf > firstHalf * 1.1) return 'improving';
    if (secondHalf < firstHalf * 0.9) return 'declining';
    return 'stable';
  }

  private getCurrentDrawdown(): number {
    const metrics = calculateBacktestMetrics(this.trades, this.config.initialBalance, this.balanceHistory);
    return metrics.currentDrawdown;
  }

  /**
   * Obtener estado actual
   */
  getStatus(): BacktestStatus {
    return {
      ...this.status,
      currentBalance: this.currentBalance,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Generar reporte ejecutivo
   */
  generateReport(result: BacktestResult): BacktestReport {
    const metrics = result.metrics;
    let recommendation: 'ready_for_autobot' | 'needs_optimization' | 'not_recommended' = 'not_recommended';
    let confidenceLevel = 0;

    if (metrics.winRate > 55 && metrics.profitFactor > 1.5 && metrics.maxDrawdown < 20) {
      recommendation = 'ready_for_autobot';
      confidenceLevel = Math.min(100, metrics.winRate + metrics.profitFactor * 20);
    } else if (metrics.winRate > 45 && metrics.profitFactor > 1.2) {
      recommendation = 'needs_optimization';
      confidenceLevel = 60;
    }

    return {
      sessionId: result.id,
      summary: {
        asset: this.config.asset,
        timeframe: this.config.timeframe,
        dateRange: {
          start: this.config.startDate,
          end: this.config.endDate,
        },
        backtestDuration: result.duration,
      },
      performance: {
        metrics,
        recommendation,
        confidenceLevel,
      },
      risks: {
        maxDrawdown: metrics.maxDrawdown,
        drawdownRisk: metrics.maxDrawdown > 30 ? 'high' : metrics.maxDrawdown > 15 ? 'moderate' : 'low',
        volatilityRisk: metrics.averageRiskReward < 1.5 ? 'high' : 'moderate',
      },
      topTrades: this.trades
        .filter((t) => t.isWinning)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5),
      worstTrades: this.trades
        .filter((t) => !t.isWinning)
        .sort((a, b) => a.profit - b.profit)
        .slice(0, 5),
      criticalIssues: result.errors.filter((e) => e.severity === 'critical').map((e) => e.message),
      recommendations: [
        metrics.winRate < 50 ? 'Mejorar filtros de entrada' : '',
        metrics.maxDrawdown > 30 ? 'Reducir riesgo por trade' : '',
        metrics.profitFactor < 1.5 ? 'Ajustar TP/SL' : '',
      ].filter((r) => r),
      generatedAt: Date.now(),
    };
  }

  /**
   * Obtener reporte de rendimiento del motor
   */
  getPerformanceReport() {
    return this.performanceTracker.generateReport();
  }
}

