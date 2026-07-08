import type { PriorityLevel } from '../types';

export class PriorityEngine {
  normalizePriority(value?: PriorityLevel): PriorityLevel {
    return value ?? 'medium';
  }

  shouldReject(priority: PriorityLevel): boolean {
    return priority === 'critical';
  }
}