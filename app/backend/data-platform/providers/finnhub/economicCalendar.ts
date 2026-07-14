import { withFinnhubToken } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";
import { FinnhubRestClient } from "./restClient";

export interface FinnhubEconomicEvent {
  country?: string;
  currency?: string;
  event?: string;
  impact?: string;
  actual?: string;
  estimate?: string;
  prev?: string;
  time?: string;
}

interface FinnhubCalendarResponse {
  economicCalendar?: FinnhubEconomicEvent[];
}

export class FinnhubEconomicCalendarService {
  constructor(
    private readonly config: FinnhubRuntimeConfig,
    private readonly restClient = new FinnhubRestClient(config)
  ) {}

  async getCalendar(fromYmd?: string, toYmd?: string): Promise<{ items: FinnhubEconomicEvent[]; latencyMs: number }> {
    const url = withFinnhubToken(this.config, "/calendar/economic", {
      from: fromYmd,
      to: toYmd,
    });
    const result = await this.restClient.getJson<FinnhubCalendarResponse>(url);
    return {
      items: result.data.economicCalendar ?? [],
      latencyMs: result.meta.latencyMs,
    };
  }
}
