import test from 'node:test';
import assert from 'node:assert/strict';

import { ExternalApiProvider } from './externalApiProvider';
import { buildProviderConfigFromEnv, resolveProviderBlockingError } from '../types/externalMarketDataProvider';

const envBackup = {
  MARKET_DATA_PROVIDER: process.env.MARKET_DATA_PROVIDER,
  MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY,
  MARKET_DATA_API_SECRET: process.env.MARKET_DATA_API_SECRET,
  MARKET_DATA_BASE_URL: process.env.MARKET_DATA_BASE_URL,
  MARKET_DATA_ENVIRONMENT: process.env.MARKET_DATA_ENVIRONMENT,
};

function restoreEnv(): void {
  process.env.MARKET_DATA_PROVIDER = envBackup.MARKET_DATA_PROVIDER;
  process.env.MARKET_DATA_API_KEY = envBackup.MARKET_DATA_API_KEY;
  process.env.MARKET_DATA_API_SECRET = envBackup.MARKET_DATA_API_SECRET;
  process.env.MARKET_DATA_BASE_URL = envBackup.MARKET_DATA_BASE_URL;
  process.env.MARKET_DATA_ENVIRONMENT = envBackup.MARKET_DATA_ENVIRONMENT;
}

test('blocks when provider is not configured', async () => {
  process.env.MARKET_DATA_PROVIDER = '';
  process.env.MARKET_DATA_API_KEY = '';

  const provider = new ExternalApiProvider();
  await assert.rejects(
    () => provider.getHistoricalCandles({
      symbol: 'XAUUSD',
      timeframe: 'M1',
      fromUtc: '2020-01-01T00:00:00.000Z',
      toUtc: '2020-01-02T00:00:00.000Z',
      limit: 100,
    }),
    /BLOCKED_BY_EXTERNAL_DEPENDENCY/
  );

  const health = await provider.getHealth();
  assert.equal(health.status, 'blocked');
  assert.match(health.message, /BLOCKED_BY_EXTERNAL_DEPENDENCY/);

  restoreEnv();
});

test('blocks when api key is missing', async () => {
  process.env.MARKET_DATA_PROVIDER = 'candidate-provider';
  process.env.MARKET_DATA_API_KEY = '';

  const config = buildProviderConfigFromEnv();
  const block = resolveProviderBlockingError(config);

  assert.ok(block);
  assert.equal(block?.code, 'DATA_PROVIDER_NOT_CONNECTED');

  const provider = new ExternalApiProvider();
  await assert.rejects(
    () => provider.getLatestCandles({ symbol: 'EURUSD', timeframe: 'M1', limit: 10 }),
    /DATA_PROVIDER_NOT_CONNECTED/
  );

  restoreEnv();
});

test('supports provider switch without coupling engine core', async () => {
  process.env.MARKET_DATA_PROVIDER = 'provider-a';
  process.env.MARKET_DATA_API_KEY = 'key-a';

  const providerA = new ExternalApiProvider();
  const healthA = await providerA.getHealth();
  assert.equal(healthA.status, 'degraded');

  process.env.MARKET_DATA_PROVIDER = 'provider-b';
  process.env.MARKET_DATA_API_KEY = 'key-b';

  const providerB = new ExternalApiProvider();
  const healthB = await providerB.getHealth();
  assert.equal(healthB.status, 'degraded');

  restoreEnv();
});
