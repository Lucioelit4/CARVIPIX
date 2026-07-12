import type { CadpSessionContext } from "./types";

export interface MarketScheduleInput {
  nowUtc: number;
  sessionTimezone: string;
  dailyMaintenanceMinuteUtc?: number;
  weeklyCloseDayUtc?: number;
  holidayScheduleActive?: boolean;
  earlyClose?: boolean;
  scheduleSource: string;
}

function getUtcParts(timestamp: number, timeZone: string): { weekday: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(timestamp));
  const weekdayText = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  return { weekday: weekdayMap[weekdayText] ?? 1, hour, minute };
}

export class SessionContextService {
  build(input: MarketScheduleInput): CadpSessionContext {
    const parts = getUtcParts(input.nowUtc, input.sessionTimezone);
    const primary_session = parts.hour < 7 ? "ASIA" : parts.hour < 13 ? "LONDON" : parts.hour < 22 ? "NEW_YORK" : "NONE";
    const overlap = parts.hour >= 13 && parts.hour < 16 ? "LONDON_NEW_YORK" : "NONE";
    const minutesToClose = primary_session === "NEW_YORK" ? Math.max(0, 22 * 60 - (parts.hour * 60 + parts.minute)) : 0;
    const minutesToMaintenance = input.dailyMaintenanceMinuteUtc ?? 0;
    const minutesToWeeklyClose = parts.weekday === 5 ? Math.max(0, 22 * 60 - (parts.hour * 60 + parts.minute)) : 0;

    return {
      market_status: primary_session === "NONE" ? "CLOSED" : minutesToClose <= 30 ? "CLOSING_SOON" : "OPEN",
      primary_session,
      session_overlap: overlap,
      minutes_to_session_close: minutesToClose,
      minutes_to_daily_maintenance: minutesToMaintenance,
      minutes_to_weekly_close: minutesToWeeklyClose,
      next_market_open_utc: null,
      holiday_schedule_active: Boolean(input.holidayScheduleActive),
      early_close: Boolean(input.earlyClose),
      schedule_source: input.scheduleSource,
    };
  }
}
