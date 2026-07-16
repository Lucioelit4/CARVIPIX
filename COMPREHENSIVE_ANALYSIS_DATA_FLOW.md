# COMPREHENSIVE CARVIPIX DATA FLOW ANALYSIS
**Date**: 2026-07-14  
**Status**: Complete Research Document

---

## 1. SCHEDULER ACTUAL — LOCATION & LOGIC

### 1.1 Adaptive Scheduler Implementation
**File**: [app/ai/cadpV2/schedulerAdaptativo.ts](app/ai/cadpV2/schedulerAdaptativo.ts)

**Class**: `AdaptiveScheduler`

**Purpose**: Manages when to execute analyses for each of the 7 canonical symbols (XAUUSD, EURUSD, GBPUSD, BTCUSD, USDINDEX, SP500, BITUCSD).

**Execution Decision Logic**:
```
1. PROXIMITY_TO_MINUTES mapping:
   - IMMEDIATE:  5 minutes
   - NEAR:       10 minutes
   - DEVELOPING: 15 minutes
   - FAR:        30 minutes
   - INVALID:    60 minutes

2. Trigger Mechanisms:
   a) TIME-BASED: Checks if next_review_at_ms ≤ current time
   b) PRICE-BASED: Watches specific price levels (PRICE_REACHES_LEVEL triggers)
   c) EXTERNAL-BASED: Manual wakeUp() calls with reason codes
   d) TIMEFRAME-CLOSE: wakeUpAll() on H1/M30 candle close

3. Recheck Schedule Update:
   - Receives adaptive_state from ChatGPT response
   - Updates next_review_at_ms = now + recheck_minutes * 60000
   - Stores wake_up_triggers for price-level monitoring
```

**Key Methods**:
| Method | Input | Output | When Called |
|--------|-------|--------|------------|
| `getInstrumentsDue(now)` | Timestamp | Array of {symbol, reason} | Every 5 minutes (tick) |
| `updateFromAdaptiveState()` | Symbol + ChatGPT response | void (updates schedule) | After each AI analysis |
| `wakeUp()` | Symbol + reason | void (immediate schedule) | On external events |
| `startTicker()` | Callback function | void (starts loop) | ObserverRunner init |

**Price Watching**:
- `registerWatchedLevel(symbol, level, nowMs)` stores price levels
- `checkPriceWakeup(symbol, currentPrice)` triggers if within 0.1% of level
- Currently: **NOT actively monitoring real-time prices** (see limitation below)

---

### 1.2 Backend Scheduler (InMemoryScheduler)
**File**: [app/backend/core/scheduler.ts](app/backend/core/scheduler.ts)

**Class**: `InMemoryScheduler`

**Purpose**: Generic task scheduling for backend maintenance/cleanup/sync tasks.

**Not used by**: The Expediente Maestro V3 flow (adaptive scheduler is independent).

---

## 2. TWELVE DATA INTEGRATION — CURRENT STATE

### 2.1 Twelve Data Provider Architecture
**Location**: `app/backend/data-platform/providers/twelve-data/`

**Key Files**:
| File | Purpose |
|------|---------|
| [config.ts](app/backend/data-platform/providers/twelve-data/config.ts) | Runtime config from env vars |
| [index.ts](app/backend/data-platform/providers/twelve-data/index.ts) | Main exports |
| [timeSeries.ts](app/backend/data-platform/providers/twelve-data/timeSeries.ts) | Historical candle fetching |
| [quotes.ts](app/backend/data-platform/providers/twelve-data/quotes.ts) | Real-time quote fetching |
| [websocket.ts](app/backend/data-platform/providers/twelve-data/websocket.ts) | WebSocket streaming |
| [connectionProbe.ts](app/backend/data-platform/providers/twelve-data/connectionProbe.ts) | Connection testing |
| [evaluationAdapter.ts](app/backend/data-platform/providers/twelve-data/evaluationAdapter.ts) | Evaluation mode wrapper |

### 2.2 Configuration
**Function**: `getTwelveDataRuntimeConfig()` in [config.ts](app/backend/data-platform/providers/twelve-data/config.ts)

**Required Environment Variables**:
```env
TWELVE_DATA_API_KEY=<your-api-key>  # REQUIRED — throws error if missing
TWELVE_DATA_REST_BASE_URL=https://api.twelvedata.com  # Default
TWELVE_DATA_WS_BASE_URL=wss://ws.twelvedata.com/v1/quotes/price  # Default
TWELVE_DATA_TIMEOUT_MS=15000  # Default
TWELVE_DATA_MAX_RETRIES=1  # Default
TWELVE_DATA_RETRY_BASE_MS=600  # Default
TWELVE_DATA_EVALUATION_MODE=true  # Default (for testing)
DATA_PLATFORM_DISABLE_TWELVE_DATA=false  # Can disable via env
```

### 2.3 Twelve Data Integration Points
**Where Twelve Data is AVAILABLE but NOT YET WIRED**:

1. **Time Series API** (`TwelveDataTimeSeriesService`)
   - Fetches historical candles (1min, 5min, 15min, 30min, 1h)
   - URL: `GET /time_series?symbol=XAUUSD&interval=1h&outputsize=200`
   - Returns: Open/High/Low/Close/Volume + metadata
   - **Status**: Implemented, tested, unused by Maestro V3

2. **Quotes API** (`TwelveDataQuoteService`)
   - Fetches real-time bid/ask quotes
   - URL: `GET /quote?symbol=XAUUSD`
   - Returns: Last price, bid, ask, volume
   - **Status**: Implemented, unused

3. **WebSocket Streaming** (`TwelveDataWebSocketClient`)
   - Real-time price updates
   - URL: `wss://ws.twelvedata.com/v1/quotes/price`
   - **Status**: Implemented, unused

4. **Connection Probe** (`runTwelveDataConnectionProbe()`)
   - Tests API connectivity, rate limits, auth
   - **Status**: Used in `scripts/twelve-data-eval.ts` only

### 2.4 How Twelve Data IS Currently Being Used
**Current Usage**: ONLY in backend data-platform (not connected to Maestro V3 analysis flow)

- `app/backend/data-platform/official-source.ts` — Data platform abstraction (not integrated with observer)
- `scripts/twelve-data-eval.ts` — Standalone evaluation script (manual testing only)

**Current Status**: 
- ✅ **Integrated at DATA PLATFORM level** (backend infrastructure)
- ❌ **NOT connected to MAESTRO V3 analysis engine** (snapshot builder, indicators, observer)
- ❌ **NOT ingesting real market data into pipeline** (see data flow section)

---

## 3. CURRENT DATA FLOW MAP

### 3.1 Full Flow Architecture

```
MARKET DATA SOURCE (MOCK/REAL)
    ↓
MarketDataPipeline
    ├── .ingestTick(raw) → Tick[] buffer per asset
    ├── .ingestCandle(raw, tf) → Candle[] buffer per asset+timeframe
    └── .getRecentCandles(asset, timeframe) → Used by SnapshotBuilder
    ↓
IndicatorFramework
    ├── .update(asset, timeframe, candle) → Calculates EMA/ATR/RSI/ADX
    └── .getLatest(asset, timeframe) → Returns TechnicalIndicators
    ↓
MaestroV3SnapshotBuilder.build()
    ├── Fetches H1/M30/M5 candles from pipeline
    ├── Fetches indicators from indicator framework
    ├── Builds 13 sections (1-13) of expediente
    ├── News from Finnhub (NewsContextProvider)
    └── Historical context from scenarioMemoryStore
    ↓
ShadowFlowV3.analyzeInstrument()
    ├── Quality gates check
    ├── Idempotency check
    └── Prompt construction
    ↓
OpenAIAdapterV2 (ChatGPT Call)
    └── Master Decision + Adaptive State
    ↓
DisparadorModulos.dispatch()
    ├── BOT_ENGINE payload
    ├── ALERTA_PREMIUM payload
    ├── TELEGRAM payload
    ├── DASHBOARD payload
    ├── OBSERVADOR payload
    └── PAPER_ACCOUNT update
```

### 3.2 Data Source Entry Points

**Question: WHERE does data enter the pipeline?**

**Answer: CRITICAL FINDING — Data entry is NOT WIRED**

| Source | Entry Point | Status |
|--------|------------|--------|
| Twelve Data API | `TwelveDataTimeSeriesService.getSeries()` | ✅ Implemented, ❌ Not called |
| Twelve Data WebSocket | `TwelveDataWebSocketClient` | ✅ Implemented, ❌ Not called |
| Demo/Synthetic Data | `DemoDataSource` | ✅ Available, ❌ No active ingestion |
| Paper Trading Monitor | `paperTradeMonitor.tick()` | ✅ Has price tracking, ❌ Not real-time |

**Current Behavior**:
- `MarketDataPipeline` is **instantiated but never fed data**
- `ingestTick()` and `ingestCandle()` are **never called**
- `getRecentCandles()` returns **empty arrays or null**
- Snapshot builder gracefully handles empty data with defaults
- Analysis continues with **zero real market data**

---

### 3.3 Data Source: Real vs Mock

**MOCK/SYNTHETIC Data Currently Used**:
1. **Hardcoded base prices** in `DemoDataSource`:
   ```typescript
   basePrices: {
     XAUUSD: 2450,
     EURUSD: 1.0850,
     GBPUSD: 1.2680,
     BTCUSD: 67500
   }
   ```

2. **Snapshot Builder Defaults**:
   - When pipeline has no data, snapshot uses zeros/nulls
   - EMA values default to 0
   - ATR defaults to 0
   - RSI defaults to 50
   - Quality flags show "NO_CLOSED_CANDLES"

3. **News Data** (partial real):
   - Uses Finnhub provider for economic events
   - `NewsContextProvider` integration in snapshot builder

4. **Paper Account Prices**:
   - No real-time price feed
   - Static entries at arbitrary prices

**Analysis Consequences**:
- ChatGPT receives:
  - ✅ Complete structure (sections 1-13)
  - ❌ Zero market microstructure (no candles, no indicators)
  - ❌ Zero technical levels (no EMA, ATR, support/resistance)
  - ❌ Zero volatility context
  - ❌ Decision quality severely degraded

---

## 4. SNAPSHOT BUILDER DATA FETCHING

**File**: [app/ai/cadpV2/snapshotBuilderV3.ts](app/ai/cadpV2/snapshotBuilderV3.ts) Lines 130-180

```typescript
async build(input: SnapshotV3BuildInput): Promise<SnapshotV3BuildResult> {
  // ── CANDLE DATA (from pipeline buffer, NOT fetched fresh)
  const h1Raw = this.pipeline.getRecentCandles(asset, "1H", 120);
  const m30Raw = this.pipeline.getRecentCandles(asset, "30M", 120);
  const m5Raw = this.pipeline.getRecentCandles(asset, "5M", 144);
  
  // ── INDICATORS (from in-memory cache, computed once per candle)
  const indH1 = this.indicators.getLatest(asset, "1H");
  const indM30 = this.indicators.getLatest(asset, "30M");
  const indM5 = this.indicators.getLatest(asset, "5M");
  
  // ── CURRENT PRICE (from M5 open candle or last close)
  const midPrice = m5Open?.close ?? m5Closed.at(-1)?.close ?? 0;
  
  // ── NEWS (fetches fresh from Finnhub)
  const newsBundle = await this.newsProvider.build({
    symbol: asset,
    snapshotUtc: new Date(nowUtc).toISOString(),
  }).catch(() => null);
}
```

**Data Freshness Requirements** (quality gates):
```typescript
const h1FreshnessSec = (nowUtc - lastH1Ts) / 1000;  // Must be < 3660s (61 min)
const m30FreshnessSec = (nowUtc - lastM30Ts) / 1000;  // Must be < 1860s (31 min)
const m5FreshnessSec = (nowUtc - lastM5Ts) / 1000;  // Must be < 360s (6 min)

const dataFresh = h1FreshnessSec < 3660 && m30FreshnessSec < 1860 && m5FreshnessSec < 360;

// If data is stale, analysis is SKIPPED_BEFORE_AI
if (!dataFresh) {
  skip_before_ai = { skip_reason: "DATA_TOO_STALE", detail: "..." }
}
```

---

## 5. FILES NEEDING MODIFICATION

### 5.1 Data Ingestion Wiring (CRITICAL)

| File | Required Change | Reason |
|------|-----------------|--------|
| `app/api/internal/observer/route.ts` | Add data source initialization to `startObserverRunner()` | Currently no data entry |
| `app/ai/cadpV2/observerRunner.ts` | Wire Twelve Data client to pipeline.ingestCandle() | Data must flow into pipeline |
| New: `app/backend/services/marketDataIngestion.ts` | Create service to fetch from Twelve Data on interval | Pull data every 5M |
| `app/backend/runtime.ts` | Initialize pipeline + indicators at startup | Currently only scheduler |

### 5.2 Observer Runner Enhancement
**File**: [app/ai/cadpV2/observerRunner.ts](app/ai/cadpV2/observerRunner.ts) Lines 80-90

**Current**:
```typescript
// Simplified price tracking — in production, wire to Twelve Data real-time
// For now, uses last known candle close from pipeline
const prices: Partial<Record<CanonicalSymbol, number>> = {};
paperTradeMonitor.tick(prices, 0);
```

**Needed**: Real-time price ingestion from Twelve Data

### 5.3 Configuration
- [app/backend/data-platform/providers/twelve-data/config.ts](app/backend/data-platform/providers/twelve-data/config.ts) — Already production-ready ✅
- `TWELVE_DATA_API_KEY` environment variable — Must be set in .env.local ⚠️

---

## 6. CURRENT LIMITATIONS vs REAL-TIME REQUIREMENTS

### 6.1 Limitations

| Component | Current State | Limitation | Impact |
|-----------|---------------|-----------|--------|
| **Data Source** | Hardcoded/mock | No real market data | ChatGPT gets zero technical context |
| **Pipeline** | Instantiated | Never ingests data | `getRecentCandles()` returns empty |
| **Indicators** | Calculated | No input candles | All values are 0 or defaults |
| **Price Tracking** | Static per trade | No real-time quotes | Paper trades irrelevant |
| **Freshness Gates** | Enforced | Always trigger skip | Every analysis skipped: `DATA_TOO_STALE` |
| **Scheduler** | 5-min tick ready | No data to trigger | Runs but produces no output |
| **News** | Finnhub integration | Works independently | Only available data |
| **Dispatch** | Ready | No decisions to dispatch | Empty outputs |

### 6.2 Real-Time Requirements

**For production Maestro V3**:
1. ✅ **Data Ingestion**: Twelve Data API → MarketDataPipeline (every tick/1M/5M)
2. ✅ **Indicator Computation**: On candle close, update indicators
3. ✅ **Schedule Triggering**: Scheduler → SnapshotBuilder → AI analysis
4. ✅ **Real-Time Dispatch**: Results → Bot Engine/Alerts/Telegram
5. ✅ **Paper Trade Monitoring**: Real prices, real P&L tracking

---

## 7. CRITICAL FINDINGS SUMMARY

### 7.1 What Works
- ✅ Scheduler logic (adaptive recheck timing)
- ✅ Quality gates (data freshness validation)
- ✅ Snapshot builder structure (all 13 sections)
- ✅ Dispatcher logic (routing to modules)
- ✅ ChatGPT integration
- ✅ Twelve Data client (API/WebSocket)
- ✅ News integration (Finnhub)
- ✅ Paper trade simulation framework

### 7.2 What's Missing
- ❌ **Data ingestion loop**: No code fetches from Twelve Data into pipeline
- ❌ **Trigger connection**: Scheduler fires but no data to analyze
- ❌ **Real-time updates**: WebSocket not connected
- ❌ **Price monitoring**: No real-time prices for trigger wakeup
- ❌ **Candle buffering**: Pipeline instantiated but never fed

### 7.3 Why Tests Pass But System Doesn't Work
```typescript
// Snapshot Builder Quality Gate (snapshotBuilderV3.ts:180-200)
if (!quality.candles_closed.H1 || !quality.candles_closed.M30 || !quality.candles_closed.M5) {
  skip_before_ai = { skip_reason: "NO_CLOSED_CANDLES" }  // ← ALWAYS TRUE
}

// Result: Every analysis skipped with NO_CLOSED_CANDLES
// ChatGPT never called, no cost, system "works" (returns no errors)
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Data Ingestion (CRITICAL)
1. Create `MarketDataIngestionService` with Twelve Data client
2. Initialize pipeline + indicators at runtime startup
3. Hook ingestion to scheduler tick (every 5 minutes)
4. Fetch last 120 H1 candles, 120 M30 candles, 144 M5 candles
5. Update indicators on each candle close

### Phase 2: Real-Time Trigger
1. Connect WebSocket for sub-1M price updates
2. Implement price level wake-up (from scheduler)
3. Feed real prices to paper trade monitor
4. Update dispatch with live prices

### Phase 3: Validation
1. Test complete flow: Twelve Data → Pipeline → Snapshot → AI → Dispatch
2. Verify quality gates pass with real data
3. Monitor ChatGPT decisions quality
4. Validate paper account P&L accuracy

---

## APPENDIX: Key Interfaces

### MarketDataPipeline
```typescript
ingestTick(raw: RawTick): Tick | null
ingestCandle(raw: RawCandle, timeframe: Timeframe): Candle | null
getRecentCandles(asset: Asset, timeframe: Timeframe, limit?: number): Candle[]
getLatestTick(asset: Asset): Tick | null
```

### IndicatorFramework
```typescript
update(asset: Asset, timeframe: Timeframe, candle: Candle, spread?: number): TechnicalIndicators
getLatest(asset: Asset, timeframe: Timeframe): TechnicalIndicators | null
getSeries(asset: Asset, timeframe: Timeframe, limit?: number): Candle[]
```

### AdaptiveScheduler
```typescript
getInstrumentsDue(nowMs?: number): Array<{ symbol: CanonicalSymbol; reason }>
updateFromAdaptiveState(symbol: CanonicalSymbol, state: AdaptiveStateV3): void
wakeUp(symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason): void
startTicker(onTick: callback): void
```

---

**Generated**: 2026-07-14 | **Analysis Scope**: Full CARVIPIX Maestro V3 data flow
