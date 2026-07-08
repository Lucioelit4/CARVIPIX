import { DatasetProfile, DatasetValidationResult, DatasetValidationRules } from './types';

const defaultRules: DatasetValidationRules = {
  minRecords: 30,
  minCoverage: 0.95,
  maxInvalidRecordRatio: 0.05,
  allowPartialAuthorized: true,
};

export class ValidationEngine {
  validateDataset(
    dataset: DatasetProfile,
    rules: Partial<DatasetValidationRules> = {},
  ): DatasetValidationResult {
    const effectiveRules = { ...defaultRules, ...rules };
    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const invalidRatio = dataset.recordCount === 0 ? 1 : dataset.invalidRecordCount / dataset.recordCount;

    if (!dataset.usable) {
      blockingReasons.push('Dataset is not usable for research.');
    }

    if (dataset.validRecordCount < effectiveRules.minRecords) {
      blockingReasons.push(`Dataset does not meet minimum sample size (${dataset.validRecordCount}/${effectiveRules.minRecords}).`);
    }

    if (dataset.coverage < effectiveRules.minCoverage) {
      blockingReasons.push(`Dataset coverage is below threshold (${dataset.coverage.toFixed(2)} < ${effectiveRules.minCoverage.toFixed(2)}).`);
    }

    if (invalidRatio > effectiveRules.maxInvalidRecordRatio) {
      blockingReasons.push(`Dataset invalid ratio is above threshold (${invalidRatio.toFixed(2)} > ${effectiveRules.maxInvalidRecordRatio.toFixed(2)}).`);
    }

    if (dataset.certification === 'INVALID') {
      blockingReasons.push('Dataset certification INVALID is rejected by Research Lab.');
    }

    if (dataset.certification === 'SIMULATED') {
      blockingReasons.push('Research Lab experiments require real CDP datasets, not simulated datasets.');
    }

    if (dataset.certification === 'PARTIAL' && (!effectiveRules.allowPartialAuthorized || !dataset.partialApprovalAuthorized)) {
      blockingReasons.push('PARTIAL datasets require explicit authorization before experiments can run.');
    }

    dataset.issues
      .filter((issue) => issue.severity === 'warning')
      .forEach((issue) => warnings.push(issue.message));

    return {
      valid: blockingReasons.length === 0,
      blockingReasons,
      warnings,
    };
  }
}