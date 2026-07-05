import { NextRequest, NextResponse } from 'next/server';
import {
  buildEngineBenchmark,
  buildResearchDashboardSnapshot,
  compareEngineVersionAgainstHistory,
  compareResearchExecutions,
  getDefaultCandidateValidationRules,
  getDefaultEngineSelectionThresholds,
  loadActiveEngineSelection,
  listEngineSelectionDecisions,
  listLocalAiIntegrationManifests,
  listCandidateValidationReports,
  listEngineHistoricalComparisonReports,
  listResearchDatasets,
  listResearchExecutionRecords,
  listResearchExports,
  selectBestEngineVersion,
} from '../../../engine/backtesting/research';

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'dashboard';
    const limit = parseNumber(searchParams.get('limit'), 200);

    if (action === 'dashboard') {
      return NextResponse.json({
        ok: true,
        data: buildResearchDashboardSnapshot(limit),
      });
    }

    if (action === 'history') {
      return NextResponse.json({
        ok: true,
        data: listResearchExecutionRecords(limit),
      });
    }

    if (action === 'benchmarks') {
      const baseline = searchParams.get('baseline') || 'engine-current';
      return NextResponse.json({
        ok: true,
        data: buildEngineBenchmark(baseline),
      });
    }

    if (action === 'comparisons') {
      return NextResponse.json({
        ok: true,
        data: listEngineHistoricalComparisonReports(limit),
      });
    }

    if (action === 'validation') {
      return NextResponse.json({
        ok: true,
        data: listCandidateValidationReports(limit),
      });
    }

    if (action === 'datasets') {
      return NextResponse.json({
        ok: true,
        data: listResearchDatasets(limit),
      });
    }

    if (action === 'exports') {
      return NextResponse.json({
        ok: true,
        data: listResearchExports(limit),
      });
    }

    if (action === 'selections') {
      return NextResponse.json({
        ok: true,
        data: listEngineSelectionDecisions(limit),
      });
    }

    if (action === 'active-selection') {
      return NextResponse.json({
        ok: true,
        data: loadActiveEngineSelection(),
      });
    }

    if (action === 'ai-manifests') {
      return NextResponse.json({
        ok: true,
        data: listLocalAiIntegrationManifests(limit),
      });
    }

    if (action === 'compare-runs') {
      const runIdsCsv = searchParams.get('runIds') || '';
      const runIds = runIdsCsv
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (runIds.length === 0) {
        return NextResponse.json({ ok: false, error: 'runIds es requerido para compare-runs' }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: compareResearchExecutions(runIds),
      });
    }

    if (action === 'compare-version') {
      const candidateRunId = searchParams.get('candidateRunId') || '';
      const candidateVersion = searchParams.get('candidateVersion') || '';

      if (!candidateRunId || !candidateVersion) {
        return NextResponse.json(
          { ok: false, error: 'candidateRunId y candidateVersion son requeridos para compare-version' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: compareEngineVersionAgainstHistory(candidateRunId, candidateVersion),
      });
    }

    if (action === 'validation-rules') {
      return NextResponse.json({
        ok: true,
        data: getDefaultCandidateValidationRules(),
      });
    }

    if (action === 'selection-thresholds') {
      return NextResponse.json({
        ok: true,
        data: getDefaultEngineSelectionThresholds(),
      });
    }

    if (action === 'select-best-version') {
      const baseline = searchParams.get('baseline') || 'engine-current';
      return NextResponse.json({
        ok: true,
        data: selectBestEngineVersion(baseline),
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Error desconocido en research backend',
      },
      { status: 500 }
    );
  }
}
