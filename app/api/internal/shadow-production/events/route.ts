/**
 * GET /api/internal/shadow-production/anomalies
 * POST /api/internal/shadow-production/anomalies (report anomaly)
 * GET /api/internal/shadow-production/events
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import {
  getAnomalies,
  reportAnomaly,
  getSystemEvents,
  logSystemEvent,
} from '@/app/lib/shadow-production/persistence';

// ─── GET anomalies ────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = req.nextUrl.pathname.split('/').pop();

    if (action === 'anomalies') {
      const severity = searchParams.get('severity') as string | null;
      const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 7;

      const anomalies = await getAnomalies({ severity: severity || undefined, days });

      return NextResponse.json({
        ok: true,
        total: anomalies.length,
        anomalies,
        filters: { severity: severity || 'all', days },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'events') {
      const module = searchParams.get('module') as string | null;
      const hours = searchParams.get('hours') ? parseInt(searchParams.get('hours')!) : 24;

      const events = await getSystemEvents({ module: module || undefined, hours });

      return NextResponse.json({
        ok: true,
        total: events.length,
        events,
        filters: { module: module || 'all', hours },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[SHADOW] Error obteniendo datos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// ─── POST report anomaly ──────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') as string;

    if (action === 'report-anomaly') {
      const body = (await req.json()) as {
        module: string;
        severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
        description: string;
        evidence?: Record<string, unknown>;
        analysis_id?: string;
        signal_id?: string;
      };

      const anomaly = await reportAnomaly({
        module: body.module,
        severity: body.severity,
        description: body.description,
        evidence: body.evidence || {},
        analysis_id: body.analysis_id,
        signal_id: body.signal_id,
        status: 'LOGGED',
      });

      return NextResponse.json({
        ok: true,
        anomaly,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'log-event') {
      const body = (await req.json()) as {
        module: string;
        severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
        event_type: string;
        description: string;
        data?: Record<string, unknown>;
        analysis_id?: string;
        signal_id?: string;
      };

      const event = await logSystemEvent({
        module: body.module,
        severity: body.severity,
        event_type: body.event_type,
        description: body.description,
        data: body.data,
        analysis_id: body.analysis_id,
        signal_id: body.signal_id,
      });

      return NextResponse.json({
        ok: true,
        event,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[SHADOW] Error en POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
