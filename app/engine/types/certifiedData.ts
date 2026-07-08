export type CertifiedDatasetStatus =
  | 'CERTIFIED'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'PARTIAL'
  | 'INVALID'
  | 'SIMULATED';

export type CertifiedDatasetSource = 'RESEARCH_LAB' | 'CDP';

export interface CertifiedDatasetEnvelope {
  datasetId: string;
  source: CertifiedDatasetSource;
  status: CertifiedDatasetStatus;
  certifiedAt?: number;
  expiresAt?: number;
  schemaVersion: string;
  checksum: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CertifiedInputContract {
  required: boolean;
  datasets: CertifiedDatasetEnvelope[];
}

export interface ResearchProposalEnvelope {
  datasetId: string;
  checksum: string;
  schemaVersion: string;
  source: 'RESEARCH_LAB';
  status: 'CERTIFIED';
  manualReviewRequired: true;
  metadata?: Record<string, string | number | boolean | null>;
}