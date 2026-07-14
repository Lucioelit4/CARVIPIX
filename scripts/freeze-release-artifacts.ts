import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  exportResearchProposalEnvelope,
  runMinimumCertifiedExperimentFromCDPExportJsonFile,
} from '../app/research-lab/core/cdp-export-adapter';
import type { ResearchExperimentDefinition, ResearchHypothesis } from '../app/research-lab/core/types';

const rootDir = process.cwd();
const fixturePath = path.join(rootDir, 'app', 'research-lab', 'fixtures', 'cdp-certified-dataset.export.json');
const cdpOutputDir = path.join(rootDir, 'exports', 'cdp', 'latest');
const researchOutputDir = path.join(rootDir, 'exports', 'research', 'latest');

function buildHypothesis(): ResearchHypothesis {
  return {
    hypothesisId: 'hyp-release-1',
    title: 'Certified release freeze remains stable',
    statement: 'A certified export should produce a manual-review-gated proposal for release freeze.',
    metricKey: 'candidateValue',
    criteria: {
      minSampleSize: 4,
      minSuccessRate: 0.75,
      minEffectSize: 0.1,
      maxFailureRate: 0.25,
      maxPValue: 0.05,
    },
  };
}

function buildExperiment(): ResearchExperimentDefinition {
  return {
    experimentId: 'exp-release-1',
    hypothesisId: 'hyp-release-1',
    name: 'Release freeze experiment',
    datasetRules: {
      minRecords: 10,
      minCoverage: 0.95,
      maxInvalidRecordRatio: 0.05,
      allowPartialAuthorized: false,
    },
    guardrails: {
      minTrials: 4,
      maxFailureRate: 0.4,
      maxRejectedTrials: 1,
    },
  };
}

const trials = [
  { trialId: 't1', status: 'passed' as const, baselineValue: 1, candidateValue: 1.2, pValue: 0.03 },
  { trialId: 't2', status: 'passed' as const, baselineValue: 1, candidateValue: 1.18, pValue: 0.04 },
  { trialId: 't3', status: 'passed' as const, baselineValue: 1, candidateValue: 1.22, pValue: 0.02 },
  { trialId: 't4', status: 'failed' as const, baselineValue: 1, candidateValue: 0.98, pValue: 0.08 },
];

async function freezeCdpArtifact(): Promise<void> {
  const raw = await readFile(fixturePath, 'utf8');
  const exportedDataset = JSON.parse(raw) as {
    envelope: {
      datasetId: string;
      source: string;
      status: string;
      certifiedAt?: number;
      schemaVersion: string;
      checksum: string;
      metadata?: Record<string, string | number | boolean | null>;
    };
    asset: string;
    timeframe: string;
    exportedAt: number;
    rowCount: number;
    rows: Array<Record<string, unknown>>;
  };

  await mkdir(cdpOutputDir, { recursive: true });
  await writeFile(path.join(cdpOutputDir, 'xauusd-certified-export-v1.json'), `${JSON.stringify(exportedDataset, null, 2)}\n`, 'utf8');

  const manifest = {
    datasetId: exportedDataset.envelope.datasetId,
    asset: exportedDataset.asset,
    timeframe: exportedDataset.timeframe,
    exportedAt: exportedDataset.exportedAt,
    rowCount: exportedDataset.rowCount,
    checksum: exportedDataset.envelope.checksum,
    source: exportedDataset.envelope.source,
    status: exportedDataset.envelope.status,
  };

  await writeFile(path.join(cdpOutputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function freezeResearchArtifact(): Promise<void> {
  const studyResult = await runMinimumCertifiedExperimentFromCDPExportJsonFile({
    filePath: fixturePath,
    hypothesis: buildHypothesis(),
    experiment: buildExperiment(),
    trials,
  });

  await exportResearchProposalEnvelope({
    studyResult,
    outputDir: researchOutputDir,
    proposalId: 'proposal',
    createdAt: studyResult.datasetProfile.receivedAt ?? Date.now(),
  });
}

async function main(): Promise<void> {
  await freezeCdpArtifact();
  await freezeResearchArtifact();
  console.log('Release artifacts frozen successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});