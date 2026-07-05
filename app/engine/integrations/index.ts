export { createBrokerSource, BrokerProviderSourceAdapter } from './brokerSource';
export { InMemoryEconomicCalendarSource } from './economicCalendarSource';
export { InMemoryNewsSource } from './newsSource';
export { InMemoryHistoricalSource } from './historicalSource';
export { DataIntegrationGateway, createDataIntegrationGateway } from './dataIntegrationGateway';

export type {
  ExternalDomain,
  ExternalSourceDescriptor,
  ExternalHealthStatus,
  ExternalSource,
  BrokerSource,
  EconomicEventSeverity,
  EconomicEvent,
  EconomicCalendarQuery,
  EconomicCalendarSource,
  NewsItem,
  NewsQuery,
  NewsSource,
  HistoricalCandle,
  HistoricalSeriesQuery,
  HistoricalSeries,
  HistoricalSource,
  IntegrationGatewayHealth,
} from './types';
