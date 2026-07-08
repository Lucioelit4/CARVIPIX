import test from 'node:test';
import assert from 'node:assert/strict';

import { ResearchProposalLoader } from './researchProposalLoader';

test('loads a valid research proposal envelope json object', () => {
  const loader = new ResearchProposalLoader();
  const result = loader.loadFromJson(
    JSON.stringify({
      datasetId: 'research-001',
      checksum: 'feed1234',
      schemaVersion: '1.0.0',
      source: 'RESEARCH_LAB',
      status: 'CERTIFIED',
      manualReviewRequired: true,
    }),
  );

  assert.deepEqual(result.issues, []);
  assert.equal(result.envelope?.datasetId, 'research-001');
});

test('returns a loader issue when proposal json is malformed', () => {
  const loader = new ResearchProposalLoader();
  const result = loader.loadFromJson('{bad-json');

  assert.equal(result.envelope, null);
  assert.deepEqual(result.issues, ['proposal json invalid']);
});

test('returns structural issues when proposal object has wrong fields', () => {
  const loader = new ResearchProposalLoader();
  const result = loader.loadFromObject({
    datasetId: '',
    checksum: '',
    schemaVersion: '',
    source: 'CDP',
    status: 'INVALID',
    manualReviewRequired: false,
  });

  assert.ok(result.envelope);
  assert.equal(result.issues.length, 6);
});