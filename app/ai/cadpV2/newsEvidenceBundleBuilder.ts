import { createHash } from "node:crypto";
import type { EconomicEvent } from "./economicEventProvider";
import type { CadpNewsBundle } from "./types";

export class NewsEvidenceBundleBuilder {
  build(input: {
    events: EconomicEvent[];
    sourceIds: string[];
    researchUsed: boolean;
    verificationRequested: boolean;
    status: CadpNewsBundle["news_status"];
  }): CadpNewsBundle {
    const serialized = JSON.stringify(input.events);
    return {
      news_status: input.status,
      last_refresh_utc: new Date().toISOString(),
      events: input.events.map((event) => ({
        event_id: event.event_id,
        event_name: event.event_name,
        scheduled_utc: event.scheduled_utc,
        minutes_to_event: Math.max(0, Math.round((Date.parse(event.scheduled_utc) - Date.now()) / 60000)),
        impact: event.impact,
        currencies: [...event.currencies],
        relevance_to_symbol: event.currencies.includes("USD") ? "HIGH" : "LOW",
        source: event.source,
        confirmed: event.confirmed,
      })),
      source_ids: [...new Set(input.sourceIds)],
      research_used: input.researchUsed,
      verification_requested: input.verificationRequested,
      evidence_hash: createHash("sha256").update(serialized).digest("hex"),
    };
  }
}
