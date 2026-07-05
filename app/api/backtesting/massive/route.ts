import { NextRequest, NextResponse } from 'next/server';
import {
  discoverHistoricalDatasetInventory,
  runMassiveBacktestingLab,
  type MassiveLabConfig,
} from '../../../engine/backtesting/massiveLab';
import type { Asset, Timeframe } from '../../../engine/types/marketData';

function parseCsvList<T extends string>(value: string | null): T[] | undefined {
  if (!value) return undefined;
  const list = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];

  return list.length > 0 ? list : undefined;
}

function sanitizeConfig(payload: Partial<MassiveLabConfig>): MassiveLabConfig {
  return {
    initialBalance: payload.initialBalance && payload.initialBalance > 0 ? payload.initialBalance : 10000,
    riskPerTrade: payload.riskPerTrade && payload.riskPerTrade > 0 ? payload.riskPerTrade : 1,
    consensusThreshold:
      payload.consensusThreshold && payload.consensusThreshold >= 5 && payload.consensusThreshold <= 10
        ? payload.consensusThreshold
        : 7,
    maxDrawdown: payload.maxDrawdown && payload.maxDrawdown > 0 ? payload.maxDrawdown : 50,
    minWinRate: payload.minWinRate && payload.minWinRate > 0 ? payload.minWinRate : 40,
    engineVersion: payload.engineVersion,
    maxWorkers: payload.maxWorkers,
    assets: payload.assets,
    timeframes: payload.timeframes,
    years: payload.years,
    includeMonteCarlo: payload.includeMonteCarlo !== false,
    includeWalkForward: payload.includeWalkForward !== false,
    monteCarloConfig: payload.monteCarloConfig,
    walkForwardConfig: payload.walkForwardConfig,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'inventory';

  if (action === 'inventory' || action === 'plan') {
    const inventory = discoverHistoricalDatasetInventory();

    return NextResponse.json({
      ok: true,
      inventory,
      recommendation: {
        workers: inventory.suggestedWorkers,
        includeMonteCarlo: true,
        includeWalkForward: true,
      },
    });
  }

  return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<MassiveLabConfig>;
    const config = sanitizeConfig(body);
    const result = await runMassiveBacktestingLab(config);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido ejecutando backtesting masivo',
      },
      { status: 500 }
    );
  }
}

/**
 * Ejemplo de uso rapido por query-string para pruebas internas:
 * /api/backtesting/massive?action=plan
 */
export async function PATCH(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const years = parseCsvList<string>(searchParams.get('years'));
  const assets = parseCsvList<Asset>(searchParams.get('assets'));
  const timeframes = parseCsvList<Timeframe>(searchParams.get('timeframes'));

  const config = sanitizeConfig({
    initialBalance: Number(searchParams.get('initialBalance') || 10000),
    riskPerTrade: Number(searchParams.get('riskPerTrade') || 1),
    consensusThreshold: Number(searchParams.get('consensus') || 7),
    maxDrawdown: Number(searchParams.get('maxDrawdown') || 50),
    minWinRate: Number(searchParams.get('minWinRate') || 40),
    engineVersion: searchParams.get('engineVersion') || undefined,
    maxWorkers: Number(searchParams.get('workers') || 0) || undefined,
    includeMonteCarlo: searchParams.get('monteCarlo') !== 'false',
    includeWalkForward: searchParams.get('walkForward') !== 'false',
    years,
    assets,
    timeframes,
  });

  try {
    const result = await runMassiveBacktestingLab(config);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
