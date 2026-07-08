import { CdpDatasetInput, CdpDatasetRequest, ResearchDatasetInput } from './types';

export type CdpDatasetFetcher = (request: CdpDatasetRequest) => Promise<CdpDatasetInput>;

export class CdpDatasetAdapter {
  adapt(input: CdpDatasetInput): ResearchDatasetInput {
    return {
      datasetId: input.datasetId,
      asset: input.asset,
      timeframe: input.timeframe,
      source: input.source,
      certification: input.certification,
      partialApprovalAuthorized: input.partialApprovalAuthorized ?? false,
      checksum: input.checksum,
      schemaVersion: input.schemaVersion,
      rowCount: input.rowCount,
      records: input.records,
      receivedAt: input.receivedAt,
    };
  }
}

export async function loadDatasetFromCDP(
  request: CdpDatasetRequest,
  fetcher: CdpDatasetFetcher,
  adapter: CdpDatasetAdapter = new CdpDatasetAdapter(),
): Promise<ResearchDatasetInput> {
  const dataset = await fetcher(request);
  return adapter.adapt(dataset);
}