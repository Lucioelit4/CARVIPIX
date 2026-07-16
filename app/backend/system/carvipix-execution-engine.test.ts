import assert from "node:assert/strict";
import test from "node:test";
import type { CadpShadowSignal } from "@/app/ai/cadpV2/types";
import {
  CarvipixExecutionEngine,
  InMemoryExecutionTransitionSink,
  type ExecutionEngineInput,
  type ExecutionEnginePorts,
} from "./carvipix-execution-engine";

function buildSignal(seed?: Partial<CadpShadowSignal>): CadpShadowSignal {
  return {
    signal_id: seed?.signal_id ?? "signal-1",
    analysis_id: seed?.analysis_id ?? "analysis-1",
    symbol: seed?.symbol ?? "XAUUSD",
    analysis_profile: "XAUUSD_INTRADAY_H1_M30_M5_V1",
    selected_strategy_id: seed?.selected_strategy_id ?? "CARVIPIX_NO_TRADE_V1",
    direction: seed?.direction ?? "NONE",
    entry: seed?.entry ?? null,
    stop_loss: seed?.stop_loss ?? null,
    take_profit: seed?.take_profit ?? null,
    calculated_gross_rr: seed?.calculated_gross_rr ?? null,
    calculated_net_rr: seed?.calculated_net_rr ?? null,
    expires_at: seed?.expires_at ?? null,
    status: "SHADOW",
    human_review_required: true,
    auto_execution_eligible: false,
  };
}

function buildPorts(overrides?: Partial<ExecutionEnginePorts>): { ports: ExecutionEnginePorts; calls: string[] } {
  const calls: string[] = [];
  const transitions = new InMemoryExecutionTransitionSink();

  const base: ExecutionEnginePorts = {
    readiness: {
      check: async () => {
        calls.push("readiness");
        return { pass: true, reasons: [] };
      },
    },
    snapshot: {
      build: async () => {
        calls.push("snapshot");
        return {
          request: {} as never,
          snapshotId: "snapshot-A",
        };
      },
    },
    cadp: {
      analyze: async () => {
        calls.push("cadp");
        return { signal: buildSignal(), validationErrors: [] };
      },
    },
    masterSignal: {
      ensurePublished: async () => {
        calls.push("master");
      },
    },
    lifecycle: {
      register: async () => {
        calls.push("lifecycle");
        return null;
      },
    },
    delivery: {
      deliver: async () => {
        calls.push("delivery");
      },
    },
    distribution: {
      fanOut: async () => {
        calls.push("distribution");
      },
    },
    transitions,
  };

  return {
    ports: {
      ...base,
      ...overrides,
    },
    calls,
  };
}

function buildInput(seed?: Partial<ExecutionEngineInput>): ExecutionEngineInput {
  return {
    analysisId: seed?.analysisId ?? "analysis-1",
    signalId: seed?.signalId ?? "signal-1",
    symbol: seed?.symbol ?? "XAUUSD",
    brokerSymbol: seed?.brokerSymbol ?? "XAUUSD",
    signalVersion: seed?.signalVersion ?? "v1",
    runId: seed?.runId,
  };
}

test("execution engine completes full coordinator path", async () => {
  const setup = buildPorts();
  const engine = new CarvipixExecutionEngine(setup.ports);

  const result = await engine.run(buildInput());

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.failedStage, undefined);
  assert.deepEqual(setup.calls, ["readiness", "snapshot", "cadp", "master", "lifecycle", "delivery", "distribution"]);
  assert.equal(result.events.filter((e) => e.status === "COMPLETED").length, 7);
});

test("execution engine blocks when readiness fails", async () => {
  const setup = buildPorts({
    readiness: {
      check: async () => ({
        pass: false,
        reasons: ["DATA_NOT_READY", "MARKET_CLOSED_OR_STALE_TICK"],
      }),
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);

  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "READINESS_GATE");
  assert.equal(result.errorCode, "DATA_NOT_READY");
  assert.deepEqual(setup.calls, []);
});

test("execution engine surfaces bridge loss as readiness failure", async () => {
  const setup = buildPorts({
    readiness: {
      check: async () => ({
        pass: false,
        reasons: ["BRIDGE_UNREACHABLE"],
      }),
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);
  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "READINESS_GATE");
  assert.match(result.errorMessage ?? "", /BRIDGE_UNREACHABLE/);
});

test("execution engine surfaces MT5 disconnect as readiness failure", async () => {
  const setup = buildPorts({
    readiness: {
      check: async () => ({
        pass: false,
        reasons: ["MT5_DISCONNECTED"],
      }),
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);
  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "READINESS_GATE");
  assert.match(result.errorMessage ?? "", /MT5_DISCONNECTED/);
});

test("execution engine stops on OpenAI down during CADP", async () => {
  const setup = buildPorts({
    cadp: {
      analyze: async () => {
        throw new Error("OPENAI_DOWN");
      },
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);
  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "CADP_OPENAI");
  assert.deepEqual(setup.calls, ["readiness", "snapshot"]);
});

test("execution engine stops on timeout during CADP", async () => {
  const setup = buildPorts({
    cadp: {
      analyze: async () => {
        throw new Error("OPENAI_TIMEOUT");
      },
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);
  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "CADP_OPENAI");
  assert.match(result.errorMessage ?? "", /OPENAI_TIMEOUT/);
});

test("execution engine dedupes by snapshot+analysis+signal", async () => {
  const setup = buildPorts({
    snapshot: {
      build: async () => ({
        request: {} as never,
        snapshotId: "snapshot-dedupe-1",
      }),
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);

  const a = await engine.run(buildInput({ analysisId: "analysis-d", signalId: "signal-d" }));
  const b = await engine.run(buildInput({ analysisId: "analysis-d", signalId: "signal-d" }));

  assert.equal(a.status, "COMPLETED");
  assert.equal(b.status, "SKIPPED_DUPLICATE");
  assert.ok(b.events.some((event) => event.status === "SKIPPED_DUPLICATE" && event.stage === "SNAPSHOT"));
});

test("execution engine fail-fast prevents downstream stages after lifecycle failure", async () => {
  const setup = buildPorts({
    lifecycle: {
      register: async () => {
        throw new Error("DB_WRITE_FAILED");
      },
    },
  });
  const engine = new CarvipixExecutionEngine(setup.ports);

  const result = await engine.run(buildInput());

  assert.equal(result.status, "FAILED");
  assert.equal(result.failedStage, "LIFECYCLE");
  assert.deepEqual(setup.calls, ["readiness", "snapshot", "cadp", "master"]);
});
