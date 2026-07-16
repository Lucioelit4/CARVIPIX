/**
 * Community Publisher V1 - Status Endpoint
 * 
 * GET /api/internal/community-publisher/status
 * Obtener status actual del sistema de Community Publisher
 */

import { NextRequest, NextResponse } from 'next/server';
import CommunityPublisherInitService from '@/app/lib/services/cpInitService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function getAlertCountToday(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const publicationsFile = path.join(
      process.cwd(),
      `data/community-publisher/publications/${today}.json`
    );

    const content = await fs.readFile(publicationsFile, 'utf-8');
    const data = JSON.parse(content);
    
    const freeAlerts = data.publications?.filter(
      (p: any) => p.type === 'FREE_ALERT' && p.status === 'DELIVERED'
    ) || [];
    
    return freeAlerts.length;
  } catch (error) {
    // Archivo no existe aún o error al leer
    return 0;
  }
}

async function getQueueLength(): Promise<number> {
  try {
    const queueFile = path.join(process.cwd(), 'data/community-publisher/queue.json');
    const content = await fs.readFile(queueFile, 'utf-8');
    const data = JSON.parse(content);
    return data.items?.length || 0;
  } catch (error) {
    return 0;
  }
}

async function getLastPublished(): Promise<any> {
  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const publicationsFile = path.join(
      process.cwd(),
      `data/community-publisher/publications/${today}.json`
    );

    const content = await fs.readFile(publicationsFile, 'utf-8');
    const data = JSON.parse(content);
    
    const delivered = data.publications?.filter(
      (p: any) => p.status === 'DELIVERED'
    ) || [];
    
    if (delivered.length === 0) return null;
    
    const last = delivered[delivered.length - 1];
    return {
      publication_id: last.publication_id,
      type: last.type,
      sent_at: last.telegram?.sent_at,
      message_id: last.telegram?.message_id
    };
  } catch (error) {
    return null;
  }
}

async function getNextInQueue(): Promise<any> {
  try {
    const queueFile = path.join(process.cwd(), 'data/community-publisher/queue.json');
    const content = await fs.readFile(queueFile, 'utf-8');
    const data = JSON.parse(content);
    
    const items = data.items || [];
    if (items.length === 0) return null;
    
    const next = items[0];
    return {
      publication_id: next.publication_id,
      type: next.type,
      priority: next.priority,
      enqueued_at: next.enqueued_at
    };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar que es una request interna usando token interno (como /api/internal/observer)
    const internalToken = request.headers.get('x-internal-token');
    const expectedToken = process.env.INTERNAL_OBSERVER_TOKEN;

    if (!expectedToken || internalToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const initService = CommunityPublisherInitService.getInstance();
    const telegramClient = initService.getTelegramClient();
    const testOnly = process.env.TEST_ONLY !== 'false';

    const [alertsToday, queueLength, lastPublished, nextInQueue] = await Promise.all([
      getAlertCountToday(),
      getQueueLength(),
      getLastPublished(),
      getNextInQueue()
    ]);

    const telStatus = telegramClient?.getStatus();

    return NextResponse.json({
      connected: telStatus?.connected || false,
      paused: process.env.PAUSE_COMMUNITY_PUBLISHER === 'true',
      channel: testOnly ? 'TEST' : 'OFFICIAL',
      test_only: testOnly,
      alerts_today: alertsToday,
      alerts_today_max: 2,
      queue_length: queueLength,
      last_published: lastPublished,
      next_in_queue: nextInQueue,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('[STATUS ENDPOINT] Error:', errorMsg);

    return NextResponse.json({
      error: errorMsg,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
