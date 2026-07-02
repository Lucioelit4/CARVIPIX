# CARVIPIX Trading Engine - Phase 1
## Professional Trading Decision System

### 🎯 Overview

The CARVIPIX Trading Engine is a **consensus-based trading analysis system** that makes decisions only when multiple specialized agents agree. No single agent decides alone. This approach eliminates bias and improves decision quality.

**Current Status:** Phase 1 (Demo & Foundation)
- ✅ 11 Analysis Agents implemented
- ✅ Consensus Engine with decision logging
- ✅ 7 Alert States system
- ✅ Demo Dashboard with 3 realistic scenarios
- ⏳ Real data integration (Phase 2)
- ⏳ Automated execution (Phase 3)

---

## 🧠 The 11 Analysis Agents

Each agent specializes in one aspect of market analysis:

### 1. **Market Regime Analyst**
- Determines overall market conditions
- Evaluates: trending vs ranging, volatility levels
- Scores based on regime favorability

### 2. **Trend Analyst**
- Analyzes price trend direction and strength
- Checks: EMA alignment (20/50/200), price position
- Identifies golden crosses and death crosses

### 3. **Structure Analyst**
- Evaluates support/resistance levels
- Detects: breakouts, bounces, structure formations
- Measures distance to key levels

### 4. **Momentum Analyst**
- RSI, MACD, momentum indicators
- Identifies: overbought/oversold conditions
- Detects momentum divergences

### 5. **Pullback Analyst**
- Finds pullback opportunities within trends
- Measures: pullback depth, trend strength
- Scores pullback quality

### 6. **Session Analyst**
- Evaluates trading session (Asian, European, US, Overlap)
- Considers: liquidity, volatility, volatility

### 7. **News Analyst**
- Monitors: economic news, fundamental events
- Assesses: sentiment impact, volatility risk
- Flags: high-impact events

### 8. **Risk Manager**
- Calculates: Risk/Reward ratios
- Evaluates: position sizing, account risk
- Enforces: risk limits

### 9. **Confidence Scoring**
- Meta-analysis: how confident are other agents?
- Considers: data quality, market conditions
- Adjusts overall confidence level

### 10. **Trade Validator**
- Final validation checks
- Confirms: all data present, price action clear
- No fundamental event risks

### 11. **Learning Engine**
- Adapts based on historical performance
- Tracks: win rate, profit factor
- Improves: decision weighting over time

---

## ⚙️ The Decision Engine

### Consensus Rules
- **Approval Threshold:** 9 out of 11 agents
- **Confidence Threshold:** 70% minimum
- **Consensus Outcome:** approved | rejected | pending

### Decision Logic
```
IF approvals >= 9 AND confidence >= 70%
  → APPROVED (Create alert)
ELSE IF rejections >= 2 OR confidence < 70%
  → REJECTED (No trade)
ELSE
  → PENDING (Wait for more clarity)
```

### Every Decision is Logged
- **What:** Symbol, type, timeframe
- **Who:** Which agents approved/rejected
- **Why:** Detailed reasoning from each agent
- **Outcome:** Action taken (alert created or rejected)

---

## 🚨 Alert States (7 Total)

1. **activa** - Alert active, waiting for TP or SL
2. **tp** - Take Profit hit ✓
3. **sl** - Stop Loss hit ✗
4. **breakeven** - Moved to breakeven
5. **cancelada** - Manually cancelled
6. **caducada** - Expired (7 days)
7. **pendiente** - Waiting for consensus approval

---

## 📊 Dashboard

### Overview Tab
- Engine status and metrics
- System architecture overview
- Demo scenarios access

### Alerts Tab
- Active alerts with entry/TP/SL
- Risk/Reward ratios
- Alert reasoning

### Decisions Tab
- Recent decision log (last 10)
- Agent approval counts
- Confidence levels
- Timestamps

### Demo Scenarios
Three realistic trading setups:
1. **EUR/USD Bullish** - Strong approval (9/11)
2. **GBP/USD Overbought** - Clear rejection (2/11)
3. **Gold Downtrend** - Strong approval (9/11)

---

## 🔍 Demo Scoring System

Each agent returns:
- **Score (0-100):** How favorable is this trade?
- **Reasoning:** Plain English explanation
- **Confidence (0-100):** How sure is this agent?
- **Key Metrics:** Specific data points used

---

## 📁 Project Structure

```
/app/engine/
├── types/
│   └── index.ts                 # Type definitions
├── core/
│   └── engine.ts                # Main decision engine
├── agents/
│   └── index.ts                 # 11 agent implementations
├── utils/
│   └── formatting.ts            # Display helpers
├── demo/
│   └── scenarios.ts             # 3 realistic scenarios
├── components/
│   ├── EngineHub.tsx            # Main dashboard
│   └── AgentConsensus.tsx       # Consensus visualization
└── page.tsx                     # Engine route (/engine)
```

---

## 🚀 Key Principles

### ✅ What We Do
- Analyze markets using 11 specialized agents
- Make decisions only with consensus (9/11)
- Log every decision with full reasoning
- Use realistic, demo data
- Maintain CARVIPIX dark/gold design
- Explain why each trade is approved/rejected

### ❌ What We DON'T Do (Yet)
- Connect to MT4/MT5 (Phase 2)
- Execute trades automatically (Phase 3)
- Manage live capital/positions
- Promise guaranteed profits
- Trade without clear consensus

---

## 📈 Metrics Tracked

- **Total Alerts:** How many trades generated?
- **Active Alerts:** Currently open positions?
- **Win Rate:** Successful / Total
- **Consensus Approval Rate:** % of signals approved
- **Average Risk/Reward:** Quality of setups
- **Confidence Average:** Overall signal strength

---

## 🎓 Learning from History

The Learning Engine tracks:
- Win rate (target: >55%)
- Profit factor (target: >1.5)
- Performance trend (improving/stable/declining)
- Adjusts confidence based on past performance

---

## 🔒 Safety Features

1. **No Solo Decisions:** Every trade needs 9/11 approval
2. **High Confidence:** 70% minimum threshold
3. **Risk Management:** Evaluated for every trade
4. **Decision Logging:** Complete audit trail
5. **News Awareness:** Fundamental events detected
6. **Time Expiry:** Alerts expire after 7 days

---

## 🔄 Future Phases

### Phase 2: Real Data Integration
- Connect to live market data feeds
- Use actual RSI, MACD, EMAs
- Integrate news APIs
- Real tick data analysis

### Phase 3: Execution
- MT4/MT5 bridge
- Automated entry
- Position management
- Live profit/loss tracking

### Phase 4: Advanced
- Machine learning from historical trades
- Adaptive agent weighting
- Multi-pair analysis
- Risk portfolio management

---

## 📝 Usage Example

```typescript
import { CARVIPIXEngine } from '@/app/engine/core/engine';
import { getDemoScenarios } from '@/app/engine/demo/scenarios';

// Create engine
const engine = new CARVIPIXEngine();

// Evaluate consensus on demo scenario
const scenario = getDemoScenarios().scenario1;
const consensus = engine.evaluateConsensus(scenario.agents);

if (consensus.outcome === 'approved') {
  // Create alert from approved signal
  const alert = engine.createAlert(scenario.signal);
  console.log(`Alert created: ${alert.id}`);
}

// Get engine state
const state = engine.getState();
console.log(`Active alerts: ${state.metrics.activeAlerts}`);
```

---

## 🎨 Design

- **Theme:** CARVIPIX Dark/Gold (#05070B, #D4AF37)
- **Animations:** Framer Motion for smooth transitions
- **Components:** React Server Components + Client Components
- **Icons:** Lucide React
- **Responsive:** Mobile-first design

---

## 📞 Questions?

This is a professional trading engine foundation. It's designed to be:
- **Explainable:** Every decision has reasons
- **Conservative:** High consensus threshold
- **Safe:** Risk-managed by default
- **Scalable:** Ready for real data in Phase 2

---

**Version:** 1.0.0 (Phase 1)
**Status:** Demo & Foundation Ready
**Next:** Phase 2 (Real Data Integration)
