import type { CertifiedDatasetEnvelope } from '../../engine/types/certifiedData';

import { CdpDatasetAdapter } from './cdp-dataset-adapter';
import {
  CdpDatasetRequest,
  ResearchDataPoint,
  ResearchDatasetInput,
  ResearchExperimentDefinition,
  ResearchHypothesis,
  ResearchProposalEnvelope,
  ResearchProposalManifest,
  ResearchStudyResult,
} from './types';
import { ResearchLab } from './research-lab';

export interface CdpCertifiedDatasetExport {
  envelope: CertifiedDatasetEnvelope;
  asset: string;
  timeframe: string;
  exportedAt: number;
  rowCount: number;
  rows: Partial<ResearchDataPoint>[];
}

export type ExportCertifiedDataset = (request: CdpDatasetRequest) => Promise<CdpCertifiedDatasetExport>;

export interface MinimumExperimentInput {
  request: CdpDatasetRequest;
  exportCertifiedDataset: ExportCertifiedDataset;
  hypothesis: ResearchHypothesis;
  experiment: ResearchExperimentDefinition;
  trials: ResearchStudyResult['experimentResult']['trials'];
}

export interface ResearchProposalExportResult {
  envelope: ResearchProposalEnvelope;
  manifest: ResearchProposalManifest;
  proposalPath: string;
  manifestPath: string;
}

export class CdpExportAdapter {
  constructor(private readonly datasetAdapter: CdpDatasetAdapter = new CdpDatasetAdapter()) {}

  async loadDatasetFromCDPExport(
    request: CdpDatasetRequest,
    exportCertifiedDataset: ExportCertifiedDataset,
  ): Promise<ResearchDatasetInput> {
    const exportedDataset = await exportCertifiedDataset(request);

    if (exportedDataset.envelope.status !== 'CERTIFIED') {
      throw new Error('CDP export must provide a CERTIFIED dataset envelope.');
    }

    if (!exportedDataset.envelope.checksum || exportedDataset.envelope.checksum.trim().length === 0) {
      throw new Error('CDP export must include a checksum.');
    }

    if (exportedDataset.rowCount <= 0) {
      throw new Error('CDP export must contain at least one row.');
    }

    return this.datasetAdapter.adapt({
      datasetId: exportedDataset.envelope.datasetId,
      asset: exportedDataset.asset,
      timeframe: exportedDataset.timeframe,
      source: exportedDataset.envelope.source,
      certification: 'CERTIFIED',
      partialApprovalAuthorized: false,
      checksum: exportedDataset.envelope.checksum,
      schemaVersion: exportedDataset.envelope.schemaVersion,
      rowCount: exportedDataset.rowCount,
      records: exportedDataset.rows,
      receivedAt: exportedDataset.exportedAt,
    });
  }
}

export async function loadDatasetFromCDPExport(
  request: CdpDatasetRequest,
  exportCertifiedDataset: ExportCertifiedDataset,
  adapter: CdpExportAdapter = new CdpExportAdapter(),
): Promise<ResearchDatasetInput> {
  return adapter.loadDatasetFromCDPExport(request, exportCertifiedDataset);
}

export async function loadDatasetFromCDPExportJsonFile(
  filePath: string,
  adapter: CdpExportAdapter = new CdpExportAdapter(),
): Promise<ResearchDatasetInput> {
  const { readFile } = await import('node:fs/promises');
  const rawJson = await readFile(filePath, 'utf8');
  const exportedDataset = JSON.parse(rawJson) as CdpCertifiedDatasetExport;

  return adapter.loadDatasetFromCDPExport(
    { datasetId: exportedDataset.envelope.datasetId, requestedBy: 'research-lab-json-loader' },
    async () => exportedDataset,
  );
}

export async function runMinimumCertifiedExperimentFromCDPExport(
  input: MinimumExperimentInput,
  researchLab: ResearchLab = new ResearchLab(),
  adapter: CdpExportAdapter = new CdpExportAdapter(),
): Promise<ResearchStudyResult> {
  const dataset = await adapter.loadDatasetFromCDPExport(input.request, input.exportCertifiedDataset);

  return researchLab.runStudy({
    dataset,
    hypothesis: input.hypothesis,
    experiment: input.experiment,
    trials: input.trials,
    manualReviewRequired: true,
  });
}

export async function runMinimumCertifiedExperimentFromCDPExportJsonFile(input: {
  filePath: string;
  hypothesis: ResearchHypothesis;
  experiment: ResearchExperimentDefinition;
  trials: ResearchStudyResult['experimentResult']['trials'];
}, researchLab: ResearchLab = new ResearchLab()): Promise<ResearchStudyResult> {
  const dataset = await loadDatasetFromCDPExportJsonFile(input.filePath);

  return researchLab.runStudy({
    dataset,
    hypothesis: input.hypothesis,
    experiment: input.experiment,
    trials: input.trials,
    manualReviewRequired: true,
  });
}

export async function exportResearchProposalEnvelope(input: {
  studyResult: ResearchStudyResult;
  outputDir?: string;
  proposalId?: string;
  createdAt?: number;
}): Promise<ResearchProposalExportResult> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const path = await import('node:path');

  const { studyResult } = input;

  if (studyResult.datasetProfile.certification !== 'CERTIFIED') {
    throw new Error('Research Proposal export requires a CERTIFIED dataset.');
  }

  if (!studyResult.datasetProfile.checksum || studyResult.datasetProfile.checksum.trim().length === 0) {
    throw new Error('Research Proposal export requires dataset checksum.');
  }

  if (!studyResult.manualReviewRequired) {
    throw new Error('Research Proposal export requires manualReviewRequired = true.');
  }

  const schemaVersion = studyResult.datasetProfile.schemaVersion?.trim();
  if (!schemaVersion) {
    throw new Error('Research Proposal export requires schemaVersion.');
  }

  const createdAt = input.createdAt ?? Date.now();
  const proposalId = input.proposalId ?? `proposal-${studyResult.experimentResult.definition.experimentId}-${createdAt}`;
  const outputDir = input.outputDir ?? path.join(process.cwd(), 'exports', 'research', 'latest');
  const proposalFileName = `${proposalId}.json`;
  const proposalPath = path.join(outputDir, proposalFileName);
  const manifestPath = path.join(outputDir, 'manifest.json');

  const envelope: ResearchProposalEnvelope = {
    proposalId,
    datasetId: studyResult.datasetProfile.datasetId,
    checksum: studyResult.datasetProfile.checksum,
    schemaVersion,
    source: 'RESEARCH_LAB',
    status: 'CERTIFIED',
    manualReviewRequired: true,
    experimentId: studyResult.experimentResult.definition.experimentId,
    createdAt,
  };

  const manifest: ResearchProposalManifest = {
    latestProposalId: proposalId,
    latestProposalFile: proposalFileName,
    updatedAt: createdAt,
    source: 'RESEARCH_LAB',
    status: 'CERTIFIED',
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(proposalPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    envelope,
    manifest,
    proposalPath,
    manifestPath,
  };
}