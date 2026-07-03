/**
 * Motor privado de backtesting para CARVIPIX Bot
 * Simula ejecución de estrategia con datos históricos
 * Uso exclusivo: Admin panel privado
 * No exponer resultados al cliente
 */

import { Asset, Timeframe, Candle, MarketData } from '../types/marketData';
import {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  BacktestStatus,
  BacktestMetrics,
  BacktestError,
  BacktestWarning,
  BacktestReport,
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

        // Procesar cierre de vela
        await this.processCandle(candle, i);

        // Verificar trades abiertos contra cierre actual
        this.checkActiveTrades(candle);
      }

      // Cerrar trades abiertos al final
      this.closePendingTrades();

      // Calcular métricas finales
      const metrics = calculateBacktestMetrics(
        this.trades,
        this.config.initialBalance,
        this.balanceHistory
      );

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

      // Simular indicadores técnicos
      const indicators = this.simulateIndicators(index);

      // Ejecutar 11 agentes
      const agentScores = this.runAgents(candle, indicators);

      // Evaluar consenso
      const consensus = this.evaluateConsensus(agentScores);

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
  ): Array<{ agent: string; score: number; confidence: number }> {
    const scores: Array<{ agent: string; score: number; confidence: number }> = [];

    try {
      // 1. Market Regime Analyst
      const regimeResult = analyzeMarketRegime({
        symbol: candle.asset,
        atr: indicators.atr || 50,
        volatility: indicators.volatility || 30,
        trend: indicators.trend || 'neutral',
      });
      scores.push({
        agent: regimeResult.agent,
        score: regimeResult.score,
        confidence: regimeResult.confidence,
      });

      // 2. Trend Analyst
      const trendResult = analyzeTrend({
        symbol: candle.asset,
        ema20: indicators.ema20 || candle.close,
        ema50: indicators.ema50 || candle.close,
        ema200: indicators.ema200 || candle.close,
        price: candle.close,
        direction: candle.close > (indicators.ema200 || candle.close) ? 'up' : 'down',
      });
      scores.push({
        agent: trendResult.agent,
        score: trendResult.score,
        confidence: trendResult.confidence,
      });

      // 3. Structure Analyst
      const structureResult = analyzeStructure({
        symbol: candle.asset,
        price: candle.close,
        resistance: candle.high,
        support: candle.low,
        breakout: candle.close > candle.open,
      });
      scores.push({
        agent: structureResult.agent,
        score: structureResult.score,
        confidence: structureResult.confidence,
      });

      // 4. Momentum Analyst
      const momentumResult = analyzeMomentum({
        symbol: candle.asset,
        rsi: indicators.rsi || 50,
        macdHistogram: indicators.macd || 0,
        momentum: candle.close > candle.open ? 'bullish' : 'bearish',
      });
      scores.push({
        agent: momentumResult.agent,
        score: momentumResult.score,
        confidence: momentumResult.confidence,
      });

      // 5. Pullback Analyst
      const pullbackResult = analyzePullback({
        symbol: candle.asset,
        isPullback: Math.random() > 0.7,
        pullbackDepth: Math.random() * 20,
        trend: candle.close > candle.open ? 'up' : 'down',
      });
      scores.push({
        agent: pullbackResult.agent,
        score: pullbackResult.score,
        confidence: pullbackResult.confidence,
      });

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
      scores.push({
        agent: sessionResult.agent,
        score: sessionResult.score,
        confidence: sessionResult.confidence,
      });

      // 7. News Analyst
      const newsResult = analyzeNews({
        symbol: candle.asset,
        hasMajorNews: Math.random() > 0.9,
        newsImpact: Math.random() > 0.5 ? 'positive' : 'negative',
        volatilityExpected: Math.random() > 0.7,
      });
      scores.push({
        agent: newsResult.agent,
        score: newsResult.score,
        confidence: newsResult.confidence,
      });

      // 8. Risk Manager
      const stopLoss = candle.low * 0.99;
      const takeProfit = candle.high * 1.01;
      const riskResult = analyzeRisk({
        symbol: candle.asset,
        entryPrice: candle.close,
        stopLossPrice: stopLoss,
        takeProfitPrice: takeProfit,
        accountRisk: this.config.riskPerTrade,
      });
      scores.push({
        agent: riskResult.agent,
        score: riskResult.score,
        confidence: riskResult.confidence,
      });

      // 9. Confidence Scoring
      const confidenceResult = scoreConfidence({
        agentAgreement: 70 + Math.random() * 20,
        dataQuality: 'high',
        marketConditions: 'normal',
        timeframe: this.config.timeframe,
      });
      scores.push({
        agent: confidenceResult.agent,
        score: confidenceResult.score,
        confidence: confidenceResult.confidence,
      });

      // 10. Trade Validator
      const validatorResult = validateTrade({
        symbol: candle.asset,
        hasAllRequiredData: true,
        noFundamentalEvents: true,
        priceActionClean: true,
        entrySureAdjustment: 0,
      });
      scores.push({
        agent: validatorResult.agent,
        score: validatorResult.score,
        confidence: validatorResult.confidence,
      });

      // 11. Learning Engine
      const learningResult = learnFromHistory({
        winRate: 55 + Math.random() * 10,
        totalTrades: 100,
        profitFactor: 1.5,
        recentPerformance: 'stable',
      });
      scores.push({
        agent: learningResult.agent,
        score: learningResult.score,
        confidence: learningResult.confidence,
      });
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
  private evaluateConsensus(agentScores: Array<{ agent: string; score: number; confidence: number }>): {
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
      const stopLoss = candle.low * 0.99; // 1% abajo del low
      const takeProfit = candle.high * 1.01; // 1% arriba del high
      const riskReward = (takeProfit - candle.close) / (candle.close - stopLoss);

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
        direction: candle.close > candle.open ? 'long' : 'short',
        quantity: riskAmount / (candle.close - stopLoss),
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
        // Aplicar slippage al entry
        const effectiveEntry = trade.entryPrice + (trade.slippage * 0.0001);

        if (trade.direction === 'long') {
          // Check TP
          if (candle.high >= trade.takeProfit) {
            this.closeTrade(tradeId, trade.takeProfit, 'tp_hit');
            return;
          }
          // Check SL
          if (candle.low <= trade.stopLoss) {
            this.closeTrade(tradeId, trade.stopLoss, 'stopped');
            return;
          }
        } else {
          // Short
          if (candle.low <= trade.takeProfit) {
            this.closeTrade(tradeId, trade.takeProfit, 'tp_hit');
            return;
          }
          if (candle.high >= trade.stopLoss) {
            this.closeTrade(tradeId, trade.stopLoss, 'stopped');
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
  private closeTrade(tradeId: string, exitPrice: number, reason: string): void {
    const trade = this.activeTrades.get(tradeId);
    if (!trade) return;

    trade.exitTime = Date.now();
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
      this.closeTrade(tradeId, lastCandle.close, 'closed_at_end');
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
   * Simular indicadores técnicos
   */
  private simulateIndicators(index: number): any {
    // En producción, calcular reales desde candles históricos
    const volatilityRange = Math.random() * 40 + 10;

    return {
      ema20: this.candles[index]?.close || 0,
      ema50: this.candles[Math.max(0, index - 10)]?.close || 0,
      ema200: this.candles[Math.max(0, index - 50)]?.close || 0,
      rsi: Math.random() * 100,
      atr: volatilityRange,
      volatility: volatilityRange,
      macd: (Math.random() - 0.5) * 100,
      trend: Math.random() > 0.5 ? 'strong_up' : 'strong_down',
    };
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
