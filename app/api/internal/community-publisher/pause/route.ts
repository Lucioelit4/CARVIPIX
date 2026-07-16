/**
 * POST /api/internal/community-publisher/pause
 * POST /api/internal/community-publisher/resume
 */
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/app/api/admin/_shared/security';
import { readConfig, writeConfig } from '@/app/lib/community-publisher/persistence';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await readConfig();
  config.paused = true;
  config.updated_at = new Date().toISOString();
  await writeConfig(config);

  return NextResponse.json({ ok: true, paused: true, updated_at: config.updated_at });
}
