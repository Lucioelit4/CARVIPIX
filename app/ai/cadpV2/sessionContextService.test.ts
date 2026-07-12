import test from "node:test";
import assert from "node:assert/strict";

import { SessionContextService } from "./sessionContextService";

test("session context service resolves market session metadata", () => {
  const service = new SessionContextService();
  const out = service.build({
    nowUtc: Date.parse("2026-07-11T14:00:00.000Z"),
    sessionTimezone: "UTC",
    dailyMaintenanceMinuteUtc: 10,
    weeklyCloseDayUtc: 5,
    holidayScheduleActive: false,
    earlyClose: false,
    scheduleSource: "test",
  });

  assert.equal(out.schedule_source, "test");
  assert.ok(["OPEN", "CLOSING_SOON", "CLOSED"].includes(out.market_status));
  assert.ok(out.minutes_to_daily_maintenance >= 0);
});
