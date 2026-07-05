/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * CARVIPIX TRADING ENGINE DASHBOARD
 * Main interface showing engine status, alerts, and consensus decisions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Brain,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { EngineState, TradeAlert, DecisionLogEntry } from '../types/index';
import { AgentConsensus } from './AgentConsensus';
import { getDemoScenarios } from '../demo/scenarios';
import { CARVIPIXEngine } from '../core/engine';

export function EngineHub() {
  const [engine] = useState(() => {
    const e = new CARVIPIXEngine();
    
    // Initialize with real consensus evaluation
    const scenarios = getDemoScenarios();
    
    // Only create alerts if consensus approves
    [scenarios.scenario1, scenarios.scenario3].forEach(scenario => {
      if (scenario.consensus.outcome === 'approved') {
        const alert = e.createAlert(scenario.signal, scenario.consensus);
        if (alert) {
          console.log(`✅ Alerta creada: ${alert.symbol} ${alert.type}`);
        }
      } else {
        console.log(`❌ Señal rechazada: ${scenario.signal.symbol} - ${scenario.consensus.reasonForDecision}`);
      }
    });
    
    return e;
  });

  const [engineState, setEngineState] = useState<EngineState>(engine.getState());
  const [selectedAlert, setSelectedAlert] = useState<TradeAlert | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionLogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'decisions'>('overview');
  const [showDemoScenario, setShowDemoScenario] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setEngineState(engine.getState());
    }, 2000);

    return () => clearInterval(interval);
  }, [engine]);

  const scenarios = getDemoScenarios();
  const metrics = engineState.metrics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] via-[#0B111A] to-[#05070B] p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#b8940f] rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CARVIPIX Motor de Trading</h1>
          <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-mono">EN LÍNEA</span>
          </div>
        </div>
        <p className="text-white/60 text-sm">Motor de Decisión Profesional de Trading • Fase 1</p>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <MetricCard
          icon={<Activity className="w-5 h-5 text-[#D4AF37]" />}
          label="Alertas Totales"
          value={metrics.totalAlertsGenerated}
          subtext={`${metrics.activeAlerts} activas`}
          color="gold"
        />
        <MetricCard
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          label="Exitosas"
          value={metrics.successfulTrades}
          subtext={`${metrics.averageWinRate.toFixed(1)}% tasa ganadora`}
          color="green"
        />
        <MetricCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          label="Fallidas"
          value={metrics.failedTrades}
          subtext={`${metrics.closedAlerts} cerradas`}
          color="red"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5 text-blue-400" />}
          label="Consenso"
          value={`${metrics.consensusApprovalRate.toFixed(0)}%`}
          subtext="Tasa de aprobación"
          color="blue"
        />
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 mb-8 border-b border-white/10"
      >
        {([
          { id: 'overview' as const, label: 'General' },
          { id: 'alerts' as const, label: 'Alertas' },
          { id: 'decisions' as const, label: 'Decisiones' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#D4AF37]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <OverviewTab
            scenarios={scenarios}
            engineState={engineState}
            onShowDemo={() => setShowDemoScenario(true)}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={engineState.alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={setSelectedAlert}
          />
        )}
        {activeTab === 'decisions' && (
          <DecisionsTab
            decisionLog={engineState.decisionLog}
            selectedDecision={selectedDecision}
            onSelectDecision={setSelectedDecision}
          />
        )}
      </AnimatePresence>

      {/* Demo Modal */}
      {showDemoScenario && (
        <DemoScenarioModal
          scenarios={scenarios}
          onClose={() => setShowDemoScenario(false)}
        />
      )}
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function MetricCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-white/60 text-sm font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-white/40">{subtext}</p>
    </motion.div>
  );
}

function OverviewTab({
  scenarios,
  engineState,
  onShowDemo,
}: {
  scenarios: any;
  engineState: EngineState;
  onShowDemo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* System Status */}
      <div className="border border-white/10 bg-white/5 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#D4AF37]" />
          Engine Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatusItem label="Status" value="Running" status="active" />
          <StatusItem label="Agents" value="11/11" status="active" />
          <StatusItem
            label="Consensus Rule"
            value="9 of 11"
            status="active"
          />
          <StatusItem
            label="Confidence Min"
            value="70%"
            status="active"
          />
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="border border-white/10 bg-white/5 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#D4AF37]" />
          Demo Scenarios
        </h2>
        <p className="text-white/60 text-sm mb-4">
          Three realistic trading scenarios showing the engine&apos;s decision-making process.
        </p>
        <button
          onClick={onShowDemo}
          className="px-4 py-2 bg-[#D4AF37] text-white font-medium rounded-lg hover:bg-[#D4AF37]/90 transition-colors"
        >
          View Scenarios
        </button>
      </div>

      {/* Architecture Info */}
      <div className="border border-white/10 bg-white/5 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">System Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[#D4AF37] font-bold mb-2">11 Agents</p>
            <ul className="text-white/70 space-y-1 text-xs">
              <li>• Market Regime Analyst</li>
              <li>• Trend Analyst</li>
              <li>• Structure Analyst</li>
              <li>• Momentum Analyst</li>
              <li>• Pullback Analyst</li>
            </ul>
          </div>
          <div>
            <p className="text-[#D4AF37] font-bold mb-2">Decision Engine</p>
            <ul className="text-white/70 space-y-1 text-xs">
              <li>• Consensus Logic</li>
              <li>• Decision Logging</li>
              <li>• Alert States (7)</li>
              <li>• Risk Management</li>
            </ul>
          </div>
          <div>
            <p className="text-[#D4AF37] font-bold mb-2">Analysis</p>
            <ul className="text-white/70 space-y-1 text-xs">
              <li>• Session Analyst</li>
              <li>• News Analyst</li>
              <li>• Risk Manager</li>
              <li>• Trade Validator</li>
              <li>• Learning Engine</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AlertsTab({
  alerts,
  selectedAlert,
  onSelectAlert,
}: {
  alerts: TradeAlert[];
  selectedAlert: TradeAlert | null;
  onSelectAlert: (alert: TradeAlert | null) => void;
}) {
  const activeAlerts = alerts.filter((a) => a.state === 'activa');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {activeAlerts.length === 0 ? (
        <div className="border border-white/10 bg-white/5 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No active alerts at this time</p>
        </div>
      ) : (
        activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => onSelectAlert(alert)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {alert.type === 'compra' ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className="font-bold text-white">{alert.symbol}</p>
                  <p className="text-xs text-white/60">{alert.timeframe} • {alert.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#D4AF37]">{alert.entryPrice.toFixed(5)}</p>
                <p className="text-xs text-white/60">Entry</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <p className="text-white/60 text-xs">Take Profit</p>
                <p className="font-mono text-green-400">{alert.takeProfitPrice.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Stop Loss</p>
                <p className="font-mono text-red-400">{alert.stopLossPrice.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">R:R Ratio</p>
                <p className="font-mono text-[#D4AF37]">{alert.riskRewardRatio.toFixed(2)}:1</p>
              </div>
            </div>

            <p className="text-xs text-white/60 line-clamp-2">{alert.reasoning}</p>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

function DecisionsTab({
  decisionLog,
  selectedDecision,
  onSelectDecision,
}: {
  decisionLog: DecisionLogEntry[];
  selectedDecision: DecisionLogEntry | null;
  onSelectDecision: (decision: DecisionLogEntry | null) => void;
}) {
  const recentDecisions = decisionLog.slice(-10).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {recentDecisions.length === 0 ? (
        <div className="border border-white/10 bg-white/5 rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white/60">No decisions logged yet</p>
        </div>
      ) : (
        recentDecisions.map((decision) => (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="border border-white/10 bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => onSelectDecision(decision)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {decision.consensus.outcome === 'approved' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <p className="font-bold text-white">{decision.symbol} {decision.type.toUpperCase()}</p>
                  <p className="text-xs text-white/60">{decision.timeframe}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{decision.consensus.approvalCount}/11</p>
                <p className="text-xs text-white/60">approvals</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Confidence: {decision.consensus.overallConfidence.toFixed(0)}%</span>
              <span className="text-white/60">{new Date(decision.timestamp).toLocaleTimeString()}</span>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

function StatusItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'active' | 'inactive';
}) {
  return (
    <div className="border border-white/10 bg-white/5 rounded p-3">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status === 'active' ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
        <p className="text-white font-mono text-sm">{value}</p>
      </div>
    </div>
  );
}

function DemoScenarioModal({
  scenarios,
  onClose,
}: {
  scenarios: any;
  onClose: () => void;
}) {
  const [selectedScenario, setSelectedScenario] = useState<1 | 2 | 3>(1);

  const scenario =
    selectedScenario === 1
      ? scenarios.scenario1
      : selectedScenario === 2
      ? scenarios.scenario2
      : scenarios.scenario3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0B111A] border border-white/10 rounded-lg max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0B111A]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Demo Scenarios</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedScenario(num as 1 | 2 | 3)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  selectedScenario === num
                    ? 'bg-[#D4AF37] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                Scenario {num}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Scenario Info */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-2">Setup Details</h3>
            <p className="text-white/70">{scenario.reasoning}</p>
          </div>

          {/* Agent Consensus */}
          <div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-4">Agent Consensus Analysis</h3>
            <AgentConsensus
              agents={scenario.agents}
              outcome={scenario.signal.status}
            />
          </div>

          {/* Signal Details */}
          <div className="border border-white/10 bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-bold text-[#D4AF37] mb-3">Trade Signal</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-white/60 mb-1">Symbol</p>
                <p className="font-mono font-bold text-white">{scenario.signal.symbol}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Type</p>
                <p className={`font-bold ${scenario.signal.type === 'compra' ? 'text-green-400' : 'text-red-400'}`}>
                  {scenario.signal.type.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Risk/Reward</p>
                <p className="font-mono font-bold text-[#D4AF37]">{scenario.signal.riskRewardRatio.toFixed(2)}:1</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

