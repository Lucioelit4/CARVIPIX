# AI Modules

This document defines the responsibility contract for each AI specialist module.

## Strategy Registry

### What receives?
Strategy definitions, strategy ids, assets, and horizons.

### What does it do?
Stores the official catalog, resolves strategies by id, and checks authorization against asset and horizon rules.

### What does it deliver?
Deterministic strategy metadata and authorization results.

### What must it never do?
It must never analyze the market, select a strategy from market conditions, or change strategy rules.

## Brain Manager

### What receives?
Market regime output, requested symbol, requested horizon, and the registry.

### What does it do?
Coordinates the flow, selects the authorized strategy id via the registry, and creates analysis identifiers.

### What does it deliver?
A plan with the authorized strategy metadata and stable analysis/signal ids.

### What must it never do?
It must never interpret market structure, generate signals, or modify strategy logic.

## Context Builder

### What receives?
Pipeline candles, indicator snapshots, timeframe roles, and the current request envelope.

### What does it do?
Builds a complete, reproducible dossier from raw inputs and computed blocks.

### What does it deliver?
A deterministic AIAnalysisRequest ready for downstream validation.

### What must it never do?
It must never decide buy or sell, select strategies, or invent market data.

## Context Optimizer

### What receives?
A complete dossier already built by the context builder.

### What does it do?
Removes noise and duplicates while preserving every important field and computed value.

### What does it deliver?
A semantically equivalent but cleaner dossier for downstream processing.

### What must it never do?
It must never change levels, indicators, or calculated data.

## AI Verifier

### What receives?
The built request and a ChatGPT response candidate.

### What does it do?
Checks structural consistency, identity matching, and prohibited direction inversions.

### What does it deliver?
A verdict with validation errors only.

### What must it never do?
It must never re-analyze the market or overwrite a valid response.

## Signal Generator

### What receives?
The validated decision package.

### What does it do?
Builds the single master signal representation.

### What does it deliver?
A stable, immutable signal object.

### What must it never do?
It must never reinterpret the analysis or add new trading meaning.

## Distribution Layer

### What receives?
The master signal and the delivery targets.

### What does it do?
Creates equal copies for the authorized consumers.

### What does it deliver?
The same signal payload to each target.

### What must it never do?
It must never mutate the signal or create target-specific variants.

## Learning Layer

### What receives?
Context, response, versions, result, and audit data.

### What does it do?
Stores immutable evidence for later review.

### What does it deliver?
A stored learning record snapshot.

### What must it never do?
It must never alter strategies, learn automatically, or affect production behavior.
