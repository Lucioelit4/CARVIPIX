/**
 * Filtro 3 — Límites Diarios
 * Máximo 2 FREE_ALERT por día en zona horaria America/Mazatlan.
 * No aplica a TRADE_RESULT, MARKET_STATUS, ni EDUCATIONAL.
 */

import type { FilterResult } from '../types';
import { getDailyCount, getTodayInTimezone } from '../persistence';

const MAX_FREE_ALERTS_PER_DAY = 2;
const TIMEZONE = 'America/Mazatlan';

export async function dailyLimitsFilter(channelId: string): Promise<FilterResult> {
  const today = getTodayInTimezone(TIMEZONE);
  const count = await getDailyCount(today, channelId);

  if (count >= MAX_FREE_ALERTS_PER_DAY) {
    return {
      passed: false,
      status: 'SKIPPED_DAILY_LIMIT',
      reason: `Límite diario alcanzado: ${count}/${MAX_FREE_ALERTS_PER_DAY} alertas gratuitas hoy (${today})`,
    };
  }

  return { passed: true };
}

export async function incrementDailyFreeAlert(channelId: string): Promise<number> {
  const { incrementDailyCounter, getTodayInTimezone: _getTodayInTimezone } = await import('../persistence');
  const today = _getTodayInTimezone(TIMEZONE);
  return incrementDailyCounter(today, channelId);
}
