import type { ResearchProposalEnvelope } from '../types';

export interface ResearchProposalLoadResult {
  envelope: Partial<ResearchProposalEnvelope> | null;
  issues: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class ResearchProposalLoader {
  loadFromJson(json: string): ResearchProposalLoadResult {
    try {
      const parsed = JSON.parse(json) as unknown;
      return this.loadFromObject(parsed);
    } catch {
      return {
        envelope: null,
        issues: ['proposal json invalid'],
      };
    }
  }

  loadFromObject(input: unknown): ResearchProposalLoadResult {
    if (!isObject(input)) {
      return {
        envelope: null,
        issues: ['proposal payload must be an object'],
      };
    }

    const envelope: Partial<ResearchProposalEnvelope> = {
      datasetId: typeof input.datasetId === 'string' ? input.datasetId : '',
      checksum: typeof input.checksum === 'string' ? input.checksum : '',
      schemaVersion: typeof input.schemaVersion === 'string' ? input.schemaVersion : '',
      source: input.source as ResearchProposalEnvelope['source'],
      status: input.status as ResearchProposalEnvelope['status'],
      manualReviewRequired: input.manualReviewRequired as true,
      metadata: isObject(input.metadata)
        ? (input.metadata as Record<string, string | number | boolean | null>)
        : undefined,
    };

    const issues: string[] = [];
    if (!envelope.datasetId?.trim()) {
      issues.push('datasetId missing');
    }
    if (!envelope.checksum?.trim()) {
      issues.push('checksum missing');
    }
    if (!envelope.schemaVersion?.trim()) {
      issues.push('schemaVersion missing');
    }
    if (envelope.source !== 'RESEARCH_LAB') {
      issues.push('source must be RESEARCH_LAB');
    }
    if (envelope.status !== 'CERTIFIED') {
      issues.push('status must be CERTIFIED');
    }
    if (envelope.manualReviewRequired !== true) {
      issues.push('manualReviewRequired must be true');
    }

    return {
      envelope,
      issues,
    };
  }
}