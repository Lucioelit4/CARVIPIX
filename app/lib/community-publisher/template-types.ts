/**
 * Community Publisher V3 — Template System Types
 */

export type TemplateType = 'FREE_ALERT' | 'MARKET_STATUS' | 'OPPORTUNITY_DEVELOPING' | 'TRADE_RESULT' | 'EDUCATIONAL_OR_PROMOTIONAL';

export type TemplateStatus = 'DRAFT' | 'APPROVED' | 'FROZEN';

export interface TemplateVariant {
  variant_id: string;
  body: string;
  preview: string;
  created_at: string;
  used_count: number;
  last_used_at?: string;
  tags?: string[];
}

export interface Template {
  template_id: string;
  type: TemplateType;
  status: TemplateStatus;
  variants: TemplateVariant[];
  description: string;
  created_at: string;
  approved_at?: string;
  frozen_at?: string;
  approved_by?: string;
  notes?: string;
}

export interface TemplateLibrary {
  free_alert: Template;
  market_status: Template;
  opportunity_developing: Template;
  trade_result: Template;
  educational_or_promotional: Template;
}

export interface TemplateSendTestRequest {
  template_id: string;
  variant_id?: string;
  publication_id?: string;
  test_data?: Record<string, unknown>;
}

export interface TemplateSendTestResult {
  ok: boolean;
  message_id?: number;
  message_preview: string;
  variant_used: string;
  delivered_at?: string;
  error?: string;
}
