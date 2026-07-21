# GPT COMMUNITY - Production Runbook

## Isolation guarantees

- Source: completed records from `analysisStore`; GPT Trading and the official dispatcher are not modified.
- Input: `CommunityMarketDossier` only. The contract rejects signal IDs, decisions, Entry, SL, TP, order plans and private analysis.
- Destinations: dedicated Community Telegram channel and `community_analysis_publications`.
- Alert history, MT5, Master Signal and official alert Telegram variables are never imported.
- Community failure is isolated from Trading because processing runs in `community-worker`.
- The editorial policy runs before OpenAI, reserves each analysis atomically and persists approved, blocked, failed and published states.
- Images are optional. Image-provider failure is audited and delivery continues as text.

## Required configuration

Configure these values in the production secret manager. Do not commit their values.

```text
INTERNAL_OBSERVER_TOKEN
OPENAI_API_KEY
OPENAI_MODEL
COMMUNITY_TELEGRAM_BOT_TOKEN
COMMUNITY_TELEGRAM_CHANNEL_TEST
COMMUNITY_TELEGRAM_CHANNEL_OFFICIAL
COMMUNITY_CRON_TOKEN
```

Initial gates:

```text
COMMUNITY_INTELLIGENCE_ENABLED=false
COMMUNITY_INTELLIGENCE_TEST_ONLY=true
COMMUNITY_INTELLIGENCE_OFFICIAL_ENABLED=false
COMMUNITY_WORKER_INTERVAL_SECONDS=300
COMMUNITY_CRON_BATCH_SIZE=20
```

## Promotion sequence

1. Deploy with `COMMUNITY_INTELLIGENCE_ENABLED=false` and run the full build/test suite.
2. Back up PostgreSQL and verify application, Observer, official Dispatcher and MT5 health.
3. Set `COMMUNITY_INTELLIGENCE_ENABLED=true` while keeping test-only mode enabled.
4. Process one current completed analysis in the dedicated test channel.
5. Verify the generated image has no prices, charts, arrows or operational language.
6. Verify the same `publication_id` appears in `/api/internal/community-intelligence/feed`.
7. Query `/api/internal/community-intelligence/evidence?trace_id=...` and retain every editorial and delivery stage.
8. Complete QA and RC approval. Only then set `COMMUNITY_INTELLIGENCE_TEST_ONLY=false` and `COMMUNITY_INTELLIGENCE_OFFICIAL_ENABLED=true` together.

## Evidence acceptance

Each successful trace must contain, in order:

1. `DOSSIER_RECEIVED`
2. `EDITORIAL_APPROVED`
3. `CONTENT_GENERATED`
4. `IMAGE_GENERATED` when an image was available
5. `TELEGRAM_DELIVERED` with Telegram `message_id`
6. `ANALYSIS_FEED_STORED` with feed ID

Editorial silence is auditable through `EDITORIAL_BLOCKED`. The ledger stores category, source, reason, hash, semantic key, model, approximate cost, total time and status.

Every entry includes `received`, `processed`, `sent`, `timestamp`, `trace_id` and result. Failed stages are also persisted with a non-secret error code.

## Rollback

Set `COMMUNITY_INTELLIGENCE_ENABLED=false` and stop `community-editorial-worker`. This stops new Community deliveries without stopping Observer, GPT Trading, the official Dispatcher, alerts or MT5. Existing publications and editorial events remain available for audit.