/**
 * Filtro 1 — Seguridad
 * Bloquea cualquier payload con datos privados o sensibles.
 */

import type { CPEvent, FilterResult } from '../types';

// Claves y patrones que NUNCA deben aparecer en un evento del CP
const BLOCKED_KEYS = [
  'analysis_private',
  'prompt',
  'api_key',
  'apikey',
  'api-key',
  'token',
  'secret',
  'password',
  'credential',
  'private_key',
  'privatekey',
  'strategy',
  'estrategia',
  'expediente',
  'razonamiento',
  'internal',
  'admin',
  'firebase_key',
  'jwt',
  'bearer',
  'authorization',
];

const BLOCKED_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,          // OpenAI keys
  /[0-9]{8,}:[A-Za-z0-9_-]{30,}/, // Telegram bot tokens
  /Bearer\s+[A-Za-z0-9._-]+/i,    // Bearer tokens
  /eyJ[A-Za-z0-9_-]+\./,          // JWT tokens
];

function containsBlockedContent(obj: unknown, depth = 0): string | null {
  if (depth > 8) return null;

  if (typeof obj === 'string') {
    const lower = obj.toLowerCase();
    for (const key of BLOCKED_KEYS) {
      if (lower.includes(key)) return `valor contiene "${key}"`;
    }
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(obj)) return `valor coincide con patrón sensible`;
    }
    return null;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = containsBlockedContent(item, depth + 1);
      if (r) return r;
    }
    return null;
  }

  if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      for (const blocked of BLOCKED_KEYS) {
        if (lowerKey.includes(blocked)) {
          return `clave bloqueada: "${key}"`;
        }
      }
      const r = containsBlockedContent(value, depth + 1);
      if (r) return r;
    }
    return null;
  }

  return null;
}

export function securityFilter(event: CPEvent): FilterResult {
  const found = containsBlockedContent(event);
  if (found) {
    return {
      passed: false,
      status: 'SKIPPED_SECURITY',
      reason: `Payload contiene datos bloqueados: ${found}`,
    };
  }
  return { passed: true };
}
