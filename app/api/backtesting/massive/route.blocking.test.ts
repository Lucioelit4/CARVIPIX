import test from 'node:test';
import assert from 'node:assert/strict';

import { GET, PATCH, POST } from './route';
import type { NextRequest } from 'next/server';

function mockNextRequest(url: string): NextRequest {
  return {
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

const envBackup = {
  CARVIPIX_ENABLE_LOCAL_DATASETS: process.env.CARVIPIX_ENABLE_LOCAL_DATASETS,
};

function restoreEnv(): void {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = envBackup.CARVIPIX_ENABLE_LOCAL_DATASETS;
}

test('GET inventory is blocked when local datasets are disabled', async () => {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = 'false';

  const request = mockNextRequest('http://localhost:3000/api/backtesting/massive?action=inventory');
  const response = await GET(request);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.code, 'MARKET_DATA_PROVIDER_NOT_CONFIGURED');
  assert.match(body.error, /BLOCKED_BY_EXTERNAL_DEPENDENCY/);

  restoreEnv();
});

test('POST massive run is blocked when local datasets are disabled', async () => {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = 'false';

  const request = new Request('http://localhost:3000/api/backtesting/massive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initialBalance: 10000, riskPerTrade: 1, consensusThreshold: 7, maxDrawdown: 50, minWinRate: 40 }),
  });

  const response = await POST(request as unknown as NextRequest);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.code, 'MARKET_DATA_PROVIDER_NOT_CONFIGURED');

  restoreEnv();
});

test('PATCH massive run is blocked when local datasets are disabled', async () => {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = 'false';

  const request = mockNextRequest('http://localhost:3000/api/backtesting/massive?action=plan');
  const response = await PATCH(request);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.match(body.error, /BLOCKED_BY_EXTERNAL_DEPENDENCY/);

  restoreEnv();
});
