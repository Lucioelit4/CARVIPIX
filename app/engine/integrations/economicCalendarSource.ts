import {
  EconomicCalendarQuery,
  EconomicCalendarSource,
  EconomicEvent,
  EconomicEventSeverity,
  ExternalHealthStatus,
} from './types';

const severityRank: Record<EconomicEventSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export class InMemoryEconomicCalendarSource implements EconomicCalendarSource {
  readonly descriptor = {
    id: 'calendar-in-memory',
    domain: 'economic-calendar' as const,
    name: 'In-Memory Economic Calendar',
    version: '1.0',
  };

  private connected = false;
  private readonly events: EconomicEvent[];

  constructor(seedEvents: EconomicEvent[] = []) {
    this.events = [...seedEvents];
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getEvents(query: EconomicCalendarQuery): Promise<EconomicEvent[]> {
    this.ensureConnected();

    const minSeverity = query.minSeverity ? severityRank[query.minSeverity] : 1;

    let results = this.events.filter((event) => {
      if (event.scheduledAt < query.from || event.scheduledAt > query.to) {
        return false;
      }

      if (severityRank[event.severity] < minSeverity) {
        return false;
      }

      if (query.currencies && query.currencies.length > 0) {
        return query.currencies.includes(event.currency);
      }

      return true;
    });

    results = results.sort((a, b) => a.scheduledAt - b.scheduledAt);

    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async checkHealth(): Promise<ExternalHealthStatus> {
    return {
      sourceId: this.descriptor.id,
      domain: this.descriptor.domain,
      healthy: this.connected,
      lastCheckedAt: Date.now(),
      message: this.connected
        ? `Calendar source ready with ${this.events.length} events`
        : 'Calendar source disconnected',
    };
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Economic calendar source is not connected.');
    }
  }
}
