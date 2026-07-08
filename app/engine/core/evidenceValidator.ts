import type { EvidenceItem, EvidenceValidationIssue, EvidenceValidationResult } from '../types';

export class EvidenceValidator {
  validate(items: EvidenceItem[], now = Date.now()): EvidenceValidationResult {
    const issues: EvidenceValidationIssue[] = [];

    for (const item of items) {
      if (!item.id?.trim()) {
        issues.push({
          itemId: item.id,
          reason: 'evidence id missing',
          severity: 'critical',
        });
      }

      if (!item.key?.trim()) {
        issues.push({
          itemId: item.id,
          reason: 'evidence key missing',
          severity: 'critical',
        });
      }

      if (!Number.isFinite(item.value) || item.value < 0 || item.value > 1) {
        issues.push({
          itemId: item.id,
          reason: 'evidence value must be in range [0,1]',
          severity: 'critical',
        });
      }

      if (!Number.isFinite(item.weight) || item.weight <= 0) {
        issues.push({
          itemId: item.id,
          reason: 'evidence weight must be > 0',
          severity: 'critical',
        });
      }

      if (!Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) {
        issues.push({
          itemId: item.id,
          reason: 'evidence confidence must be in range [0,1]',
          severity: 'critical',
        });
      }

      if (!Number.isFinite(item.uncertainty) || item.uncertainty < 0 || item.uncertainty > 1) {
        issues.push({
          itemId: item.id,
          reason: 'evidence uncertainty must be in range [0,1]',
          severity: 'critical',
        });
      }

      if (item.expiresAt <= now) {
        issues.push({
          itemId: item.id,
          reason: 'evidence expired',
          severity: 'warning',
        });
      }

      const confidenceUncertaintyDrift = Math.abs(item.confidence + item.uncertainty - 1);
      if (confidenceUncertaintyDrift > 0.2) {
        issues.push({
          itemId: item.id,
          reason: 'confidence + uncertainty should be close to 1',
          severity: 'warning',
        });
      }
    }

    const critical = issues.some((issue) => issue.severity === 'critical');
    return {
      valid: !critical,
      issues,
    };
  }
}
