# CARVIPIX Final Motor Source Manifest

## Candidate identity

- Worktree: `C:\Users\user1\carvipix-motor-final`
- Branch: `carvipix-motor-final`
- Base revision: `30408898a56c5556d6e817d5592db96739bf6e9a`
- Initial status: clean
- Production deployment: `53514364-818b-429f-a052-5f799a8c2c3e`
- Production image: `sha256:00d9db7275313fb96c53945adc55b4e53798575bb435ec059ce33607539d14ba`
- Preview deployment: `7c098896-04e5-4259-afa5-b7686115f6dc`
- Preview image: `sha256:d420a6d01094872f83f8608996f4a7aa6eb1a962d7a4f5f5d0c7fd47237dc296`
- Production and Preview are rollback references only. This candidate must not deploy to Production.

## Source A: organic decision core

Revision: `9061ec700094f632c34226458debb9b3c709772c`

| File | Blob | Intended ownership |
| --- | --- | --- |
| `app/ai/cadpV2/promptBuilderV3.ts` | `5d50f60ddc542f087b7d2bcb588cfdebb0b34a0d` | Four-state OpenAI decision contract |
| `app/ai/cadpV2/snapshotBuilderV3.ts` | `dc92805ef5f7337fca460d79ef5b01f01d0bb6bb` | H1/M30/M5 evidence and quality gates |
| `app/ai/cadpV2/verifierV3.ts` | `ccb37aa82f166c7de46e22fd7bb7efdab678a817` | ENTER/WAIT/NO_TRADE verification |
| `app/ai/cadpV2/typesMaestroV3.ts` | `959a59948e608fe8fc6888d2bcde4710f8be21ac` | `CadpDecisionContractV3` compatibility boundary |
| `app/ai/cadpV2/observerRunner.ts` | `1f0dd03ec01406f036a406ad2d41be2970ecb283` | Persistent cycle orchestration behavior |
| `app/ai/cadpV2/analysisCycleControl.ts` | `9cb5a75b2726fb19ced835341bb6d45af7202ee7` | Slot claim and cycle exclusion |
| `app/ai/cadpV2/waitDeduplication.ts` | `3d17225f124524ffc7a7d8e67270db01177aa279` | Duplicate WAIT suppression |
| `app/ai/cadpV2/masterSignalBuilder.ts` | `d82635e0a9fb4e77be23a3912a1aa39a4c32114a` | Signal Maestra construction boundary |

`observerRuntimeLease.ts` is not present at Source A revision and therefore has no Source A blob attribution. Runtime ownership must be recovered from verified history or implemented through the existing persistent cycle-control abstraction.

The decision core may classify analytical context broadly, but the OpenAI output contract exposed to execution is exactly `ENTER_BUY`, `ENTER_SELL`, `WAIT`, or `NO_TRADE`. Compatibility translation belongs outside the decision core.

## Source B: modern downstream infrastructure

Revision: `30408898a56c5556d6e817d5592db96739bf6e9a`

| File or boundary | Blob | Policy |
| --- | --- | --- |
| `app/ai/cadpV2/masterSignalBuilder.ts` | `d82635e0a9fb4e77be23a3912a1aa39a4c32114a` | Preserve official Signal Maestra shape |
| `app/backend/services/real-signal-lifecycle-service.ts` | `21cf31c277d2a1e69c5fbd75230554c073e35168` | Preserve modern lifecycle |
| `app/backend/services/alerts-domain-service.ts` | `deed66c82dc3f296a9598a2172ff12c20339b7d3` | Preserve Alertas domain |
| `app/ai/cadpV2/telegramNotificationService.ts` | `a60594ba078a95db939939eb12220d1507f8b101` | Preserve Telegram delivery |
| `app/ai/cadpV2/telegramDeliveryLedger.ts` | `12ff576ea6285894b64d80b189cf244ed211b245` | Preserve delivery ledger |
| `app/backend/services/master-event-dispatcher.ts` | `218cc7717d1f9cf28ec457642cb2c3791b36874e` | Preserve event fanout |
| `app/backend/services/bot-mt5-service.ts` | `908784dcfa197a4fcad5457dc8af1da0d73bc937` | Preserve MT5 service and ACK lifecycle |
| `app/api/bot/mt5/**` | Base revision tree | Preserve transport routes and authentication |

## Required flow

`DATA -> OBSERVER -> OLD DOSSIER -> OPENAI -> OLD VERIFIER/DECISION -> MASTER SIGNAL -> MODERN LIFECYCLE -> ALERTS/TELEGRAM/MT5 -> ACK/RESULTS`

## Candidate integration boundaries

- `master-signal-publisher.ts` persists the modern lifecycle before invoking the master event cycle.
- `runtime.ts` installs that publisher as the only Signal Maestra downstream bridge.
- The V3 shadow flow remains the owner of modern Telegram delivery and its ledger. The dispatcher skips only its legacy Telegram send for V3-published signals, preventing duplicate alerts.
- The dispatcher remains the owner of master-event distribution and MT5 commercial-gate fanout.
- `/api/bot/mt5/ack` persists normalized EA acknowledgement status, installation correlation, runtime evidence, and master-event metadata.
- Unknown or mismatched Signal/License ACK ownership fails closed with `ACK_NOT_PERSISTED`.

## Local certification status

- Maestro V3 certification: 58/58 passed.
- Scheduler, cycle, and WAIT controls: 11/11 passed.
- Observer lease and database slot controls: 7/7 passed.
- Signal Maestra publisher: 2/2 passed.
- MT5 ACK persistence and ownership: 2/2 passed.
- Modified production files: no language-server diagnostics.
- Focused decision-core ESLint: zero errors and zero warnings.
- Webpack compilation: passed. Final Next build typecheck remains blocked by an unrelated pre-existing invalid `GET_Licenses` route export.
- Global TypeScript: pre-existing route and unrelated test errors remain; no errors in the restored decision-core files.
- No OpenAI, Telegram, MT5, deployment, or other external operation was executed during the historical fidelity restoration.
- No migration or deployment has been executed.

## Construction controls

- No edits in existing worktrees.
- No Production deployment.
- No `test:system` against shared infrastructure.
- No secret values in files, logs, or reports.
- Validate each decision-core port before changing downstream infrastructure.
- Preview certification must keep the organic Observer disabled until explicitly authorized.