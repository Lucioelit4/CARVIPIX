# Data Integration Gateway

This folder defines the single external data access point for the engine.

## Principle

All external providers are consumed through `DataIntegrationGateway`.
No engine module should call broker, calendar, news, or historical APIs directly.

## Sources Covered

- Broker market data through `BrokerProviderSourceAdapter`
- Economic calendar through `EconomicCalendarSource`
- News through `NewsSource`
- Historical series through `HistoricalSource`
- Future APIs through `registerSource()` with `domain: 'custom'`

## Current Bootstrap

`createDataIntegrationGateway()` wires:

- broker source from provider factory
- in-memory economic calendar source (safe default)
- in-memory news source (safe default)
- in-memory historical source (safe default)

This allows immediate integration without coupling internal modules to provider SDKs.

## Runtime Flow

1. `EngineDataRuntime.initialize()` builds and connects the gateway.
2. Runtime reads snapshots/events/news/history only from the gateway.
3. Runtime can request full integration health with `getIntegrationHealth()`.
4. `shutdown()` disconnects all sources in one call.
