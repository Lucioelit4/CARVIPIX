import type { EconomicEvent, EconomicEventProvider } from "./economicEventProvider";

export class DefaultEconomicEventProvider implements EconomicEventProvider {
  async getEvents(input: { symbol: string; fromUtc: string; toUtc: string }): Promise<EconomicEvent[]> {
    void input;
    return [];
  }

  getSourceId(): string {
    return "economic-default-empty";
  }
}
