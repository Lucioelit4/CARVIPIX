'use client';

/**
 * AGENT CONSENSUS VISUALIZATION
 * Shows how each of the 11 agents voted
 */

import { AgentScore } from '../types/index';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';

interface AgentConsensusProps {
  agents: AgentScore[];
  outcome: 'approved' | 'rejected' | 'pending';
}

export function AgentConsensus({ agents, outcome }: AgentConsensusProps) {
  const sortedAgents = [...agents].sort((a, b) => b.score - a.score);

  const getAgentStatus = (score: number) => {
    if (score >= 60) return 'approved';
    if (score < 40) return 'rejected';
    return 'neutral';
  };

  const getAgentColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      default:
        return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedAgents.map((agent, i) => {
          const status = getAgentStatus(agent.score);
          const color = getAgentColor(status);

          return (
            <motion.div
              key={agent.agent}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-lg p-3 ${color} transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="font-mono text-sm font-bold">{agent.agent}</span>
                </div>
                <span className="font-bold text-lg">{agent.score.toFixed(0)}</span>
              </div>

              <p className="text-xs opacity-75 mb-2 line-clamp-2">{agent.reasoning}</p>

              <div className="flex items-center justify-between text-xs">
                <span>Confidence: {agent.confidence.toFixed(0)}%</span>
                {/* Score bar */}
                <div className="w-16 h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.score}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                    className={`h-full rounded-full ${
                      status === 'approved'
                        ? 'bg-green-400'
                        : status === 'rejected'
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border border-white/10 bg-white/5 rounded-lg p-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-white/60 mb-1">Approvals</p>
            <p className="text-2xl font-bold text-green-400">
              {agents.filter((a) => a.score >= 60).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Neutral</p>
            <p className="text-2xl font-bold text-slate-400">
              {agents.filter((a) => a.score >= 40 && a.score < 60).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Rejections</p>
            <p className="text-2xl font-bold text-red-400">
              {agents.filter((a) => a.score < 40).length}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
