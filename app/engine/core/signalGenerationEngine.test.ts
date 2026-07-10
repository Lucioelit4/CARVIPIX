import assert from "node:assert/strict";
import test from "node:test";

import { SignalGenerationEngine } from "./signalGenerationEngine";

const engine = new SignalGenerationEngine();

function baseInput() {
  return {
    symbol: "EURUSD",
    marketType: "trend_bullish" as const,
    session: "overlap" as const,
    newsImpact: "none" as const,
    spreadPips: 1.2,
    lowLiquidity: false,
    volatilityIndex: 52,
    falseBreakoutRisk: 0.2,
    atrPips: 14,
    context1H: {
      price: 1.105,
      ema20: 1.1042,
      ema50: 1.103,
      ema200: 1.101,
    },
    structure45M: {
      ema20: 1.104,
      ema50: 1.1028,
      ema200: 1.1012,
      bias: "bullish" as const,
      falseBreakoutDetected: false,
    },
    entry5M: {
      price: 1.1052,
      ema20: 1.105,
      ema50: 1.1044,
      ema200: 1.103,
      pullbackValid: true,
      breakoutValid: true,
    },
  };
}

test("mercado en tendencia genera señal operativa", () => {
  const signal = engine.generate(baseInput());
  assert.equal(signal.decision, "BUY");
  assert.ok(signal.entry !== null);
  assert.ok(signal.sl !== null);
  assert.ok(signal.tp !== null);
});

test("mercado en rango sin confirmacion devuelve WAIT", () => {
  const signal = engine.generate({
    ...baseInput(),
    marketType: "range",
    structure45M: {
      ...baseInput().structure45M,
      bias: "neutral",
    },
    entry5M: {
      ...baseInput().entry5M,
      pullbackValid: false,
      breakoutValid: false,
    },
  });

  assert.equal(signal.decision, "WAIT");
});

test("noticia de alto impacto bloquea con NO_TRADE", () => {
  const signal = engine.generate({
    ...baseInput(),
    newsImpact: "high",
  });

  assert.equal(signal.decision, "NO_TRADE");
  assert.ok(signal.blockedBy.includes("high_impact_news"));
});

test("spread alto bloquea operación", () => {
  const signal = engine.generate({
    ...baseInput(),
    spreadPips: 4.5,
  });

  assert.equal(signal.decision, "NO_TRADE");
  assert.ok(signal.blockedBy.includes("high_spread"));
});

test("pullback valido mantiene señal de continuidad", () => {
  const signal = engine.generate({
    ...baseInput(),
    entry5M: {
      ...baseInput().entry5M,
      pullbackValid: true,
      breakoutValid: true,
    },
  });

  assert.equal(signal.decision, "BUY");
  assert.ok(signal.reason.includes("clasificacion"));
});

test("pullback validator integrado bloquea setup inconsistente", () => {
  const signal = engine.generate({
    ...baseInput(),
    structure45M: {
      ...baseInput().structure45M,
      bias: "bullish",
      ema20: 1.101,
      ema50: 1.104,
      ema200: 1.105,
    },
    entry5M: {
      ...baseInput().entry5M,
      pullbackValid: true,
      breakoutValid: true,
    },
  });

  assert.equal(signal.decision, "WAIT");
  assert.ok(signal.reason.includes("Pullback validator"));
});

test("ruptura falsa se rechaza", () => {
  const signal = engine.generate({
    ...baseInput(),
    falseBreakoutRisk: 0.9,
    structure45M: {
      ...baseInput().structure45M,
      falseBreakoutDetected: true,
    },
  });

  assert.equal(signal.decision, "WAIT");
  assert.ok(signal.blockedBy.includes("false_breakout"));
});

test("señal A+ cuando confluencia es máxima", () => {
  const signal = engine.generate({
    ...baseInput(),
    session: "overlap",
    spreadPips: 0.4,
    volatilityIndex: 45,
    falseBreakoutRisk: 0.1,
  });

  assert.equal(signal.decision, "BUY");
  assert.equal(signal.classification, "A+");
});

test("clasificación B fuera de overlap se bloquea por hardening", () => {
  const signal = engine.generate({
    ...baseInput(),
    session: "london",
    spreadPips: 2.1,
    volatilityIndex: 72,
    falseBreakoutRisk: 0.5,
    entry5M: {
      ...baseInput().entry5M,
      pullbackValid: true,
      breakoutValid: false,
    },
  });

  assert.equal(signal.classification, "B");
  assert.equal(signal.decision, "WAIT");
  assert.ok(signal.reason.includes("Hardening activo"));
});

test("señal rechazada por baja liquidez extrema", () => {
  const signal = engine.generate({
    ...baseInput(),
    lowLiquidity: true,
    marketType: "low_liquidity",
    session: "off_session",
  });

  assert.ok(signal.decision === "WAIT" || signal.decision === "NO_TRADE");
  assert.ok(signal.blockedBy.includes("low_liquidity"));
});

test("expone mercados reconocidos y riesgos bloqueados", () => {
  const markets = engine.getRecognizedMarkets();
  const risks = engine.getBlockedRiskTypes();

  assert.ok(markets.includes("trend_bullish"));
  assert.ok(markets.includes("range"));
  assert.ok(risks.includes("high_impact_news"));
  assert.ok(risks.includes("false_breakout"));
});
