import type { ConflictDescriptor } from '../types';

export class ConflictResolutionEngine {
  hasBlockingConflict(conflicts?: ConflictDescriptor[]): boolean {
    return (conflicts ?? []).some((conflict) => conflict.severity === 'critical' || conflict.severity === 'high');
  }

  summarize(conflicts?: ConflictDescriptor[]): string {
    return (conflicts ?? []).map((conflict) => conflict.reason).join(' | ');
  }
}