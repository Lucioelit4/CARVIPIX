/**
 * Template Engine — Renderiza mensajes desde plantillas
 *
 * Responsabilidades:
 * - Validar datos contra tipo de publicación
 * - Seleccionar variante (rotativa)
 * - Renderizar mensaje con datos públicos
 * - Garantizar cero datos privados
 */

import type { Publication } from './types';
import type { TemplateVariant } from './template-types';
import { loadTemplates } from './templatePersistence';

// ─── Validaciones de seguridad ───────────────────────────────────────────────

const FORBIDDEN_KEYWORDS = [
  'prompt',
  'private',
  'secret',
  'api_key',
  'token',
  'strategy',
  'expediente',
  'razonamiento',
  'admin',
  'credential',
  'password',
];

function validateForSafetyKeywords(text: string): { safe: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (lower.includes(kw)) {
      return { safe: false, reason: `Contiene palabra bloqueada: "${kw}"` };
    }
  }
  return { safe: true };
}

// ─── Selectores de variante ──────────────────────────────────────────────────

let variantRotation: Record<string, number> = {};

function getNextVariantIndex(templateId: string, count: number): number {
  if (!variantRotation[templateId]) {
    variantRotation[templateId] = 0;
  }
  const idx = variantRotation[templateId] % count;
  variantRotation[templateId] = (variantRotation[templateId] + 1) % count;
  return idx;
}

// ─── Renderizador de plantillas ──────────────────────────────────────────────

interface RenderContext {
  publication: Publication;
  data?: Record<string, unknown>;
}

export async function renderTemplate(
  templateId: string,
  context: RenderContext,
  variantOverride?: string,
): Promise<{ text: string; variant_id: string; safe: boolean; reason?: string }> {
  const templates = await loadTemplates();
  const template = templates[templateId];

  if (!template) {
    return {
      text: '',
      variant_id: '',
      safe: false,
      reason: `Plantilla no encontrada: ${templateId}`,
    };
  }

  if (template.status === 'FROZEN') {
    // Ok — plantilla frozen es lo que queremos
  } else if (template.status !== 'APPROVED') {
    return {
      text: '',
      variant_id: '',
      safe: false,
      reason: `Plantilla no aprobada: ${template.status}`,
    };
  }

  if (template.variants.length === 0) {
    return {
      text: '',
      variant_id: '',
      safe: false,
      reason: `Plantilla sin variantes`,
    };
  }

  // Seleccionar variante
  let variant: TemplateVariant;
  if (variantOverride) {
    variant = template.variants.find(v => v.variant_id === variantOverride) ?? template.variants[0];
  } else {
    const idx = getNextVariantIndex(templateId, template.variants.length);
    variant = template.variants[idx];
  }

  // Renderizar (reemplazar placeholders)
  let text = variant.body;

  // {{instrument}}
  if (context.publication.instrument) {
    text = text.replace(/\{\{instrument\}\}/g, context.publication.instrument);
  }

  // {{analysis_public.*}}
  if (context.publication.metadata) {
    const ap = context.publication.metadata.analysis_public as Record<string, unknown> | undefined;
    if (ap) {
      text = text.replace(/\{\{entry\}\}/g, String(ap.entry ?? ''));
      text = text.replace(/\{\{stop_loss\}\}/g, String(ap.stop_loss ?? ''));
      text = text.replace(/\{\{take_profit\}\}/g, String(ap.take_profit ?? ''));
      text = text.replace(/\{\{risk_reward\}\}/g, String(ap.risk_reward ?? ''));
    }
  }

  // {{trade_result.*}}
  if (context.publication.metadata?.trade_result) {
    const tr = context.publication.metadata.trade_result as Record<string, unknown>;
    text = text.replace(/\{\{result\}\}/g, String(tr.result ?? ''));
    text = text.replace(/\{\{pnl_pips\}\}/g, String(tr.pnl_pips ?? ''));
    text = text.replace(/\{\{pnl_percent\}\}/g, String(tr.pnl_percent ?? ''));
  }

  // {{decision}}
  if (context.publication.metadata?.decision) {
    text = text.replace(/\{\{decision\}\}/g, String(context.publication.metadata.decision));
  }

  // {{origin}}
  text = text.replace(/\{\{origin\}\}/g, context.publication.origin ?? 'PAPER');

  // {{confidence_level}}
  if (context.publication.metadata?.confidence_level) {
    text = text.replace(/\{\{confidence_level\}\}/g, String(context.publication.metadata.confidence_level));
  }

  // Validar seguridad
  const safety = validateForSafetyKeywords(text);
  if (!safety.safe) {
    return {
      text: '',
      variant_id: variant.variant_id,
      safe: false,
      reason: safety.reason,
    };
  }

  return {
    text,
    variant_id: variant.variant_id,
    safe: true,
  };
}
