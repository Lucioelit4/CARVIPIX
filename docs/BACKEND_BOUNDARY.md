# Backend Boundary - CARVIPIX

## Scope
This document defines the architecture boundary between ecosystem modules and Trading Engine internals.

## Allowed Access Model
1. Ecosystem modules consume domain data through backend facade services.
2. The official entrypoint is app/backend/runtime.ts via exported ecosystemServices.
3. Trading Engine internals are accessed only by app/backend/adapters/trading-engine-gateway-adapter.ts.

## Layer Responsibilities
1. app/backend/contracts
- Define service interfaces and shared domain contracts.
- No business logic and no direct Engine imports.

2. app/backend/core
- Infrastructure primitives (container, event bus, wiring).
- No direct Engine imports.

3. app/backend/adapters
- Translate between Engine internals and backend contracts.
- Only allowed non-engine layer to import from restricted Engine paths.

4. app/backend/services
- Domain service orchestration for ecosystem modules.
- Must depend on contracts and adapters, not on Engine internals.

5. app/lib/modules and pages
- Consume backend facade (runtime/services), never Engine internals directly.

## Prohibited Imports
Outside app/backend/adapters and app/engine internals, these imports are forbidden:
1. app/engine/core/**
2. app/engine/agents/**
3. app/engine/strategy/**
4. app/engine/alerts/**

Equivalent relative imports to engine/core, engine/agents, engine/strategy, engine/alerts are also forbidden.

## Enforcement
1. ESLint guardrail in eslint.config.mjs via no-restricted-imports.
2. Architecture audit script:
- scripts/audit-prohibited-engine-imports.mjs
- npm run audit:architecture

## How to Connect a New Module
1. Add/update contract in app/backend/contracts.
2. Implement or extend domain service in app/backend/services.
3. Reuse existing adapter or add a new adapter if a new external boundary is required.
4. Expose through app/backend/runtime.ts.
5. Consume only facade APIs from app/lib/modules or route handlers.

## How to Add a New Service Safely
1. Define interface first (contracts).
2. Add service implementation in services.
3. Register in runtime and container.
4. Keep adapter-only rule for Engine internals.
5. Run validation:
- TypeScript check
- Lint on modified files
- npm run audit:architecture
