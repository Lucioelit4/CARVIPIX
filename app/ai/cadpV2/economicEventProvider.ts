export interface EconomicEvent {
  event_id: string;
  event_name: string;
  scheduled_utc: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  currencies: string[];
  source: string;
  confirmed: boolean;
}

export interface EconomicEventProvider {
  getEvents(input: { symbol: string; fromUtc: string; toUtc: string }): Promise<EconomicEvent[]>;
  getSourceId(): string;
}
