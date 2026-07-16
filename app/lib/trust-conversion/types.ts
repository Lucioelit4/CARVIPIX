/**
 * Trust & Conversion Engine — Type Contracts
 * Motor de confianza y conversión ético para Community Publisher V1
 */

// ─── Tipos de Productos ──────────────────────────────────────────────────────

export type ConversionProduct = 'PREMIUM_ALERTS' | 'BOT' | 'COMMUNITY' | 'TUTORIALS' | 'REGISTRATION';

export interface Product {
  id: ConversionProduct;
  name: string;
  description: string;
  url: string;
  icon: string;
}

// ─── Momentos Comerciales ─────────────────────────────────────────────────────

export type CommercialMomentType =
  | 'WINNING_STREAK'          // Racha positiva documentada
  | 'NOTABLE_RESULT'          // Resultado destacado
  | 'HIGH_MARKET_ACTIVITY'    // Alta actividad real
  | 'NO_OPPORTUNITIES'        // Mercado sin oportunidades (educación)
  | 'PRODUCT_LAUNCH'          // Lanzamiento real
  | 'ENGAGEMENT_PEAK'         // Pico de engagement
  | 'CONSISTENCY_MILESTONE';  // Hito de consistencia

export type CommercialMomentStatus =
  | 'DETECTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface CommercialMoment {
  moment_id: string;
  type: CommercialMomentType;
  status: CommercialMomentStatus;
  confidence: number; // 0-100
  priority: number; // 1-5 (1=high)
  
  // Contexto
  trigger_data: Record<string, unknown>;
  detected_at: string;
  suggested_at?: string;
  approved_at?: string;
  published_at?: string;
  
  // Sugerencia
  suggested_product: ConversionProduct;
  suggested_message?: string;
  reason: string;
  
  // Resultado
  suggestion_id?: string;
  publication_id?: string;
  clicks?: number;
  registrations?: number;
  conversions?: number;
  revenue?: number;
  
  // Límites respetados
  respects_frequency?: boolean;
  respects_cooldown?: boolean;
  respects_ratio?: boolean;
}

export interface CommercialSuggestion {
  suggestion_id: string;
  moment_id: string;
  product: ConversionProduct;
  
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  
  message_body: string;
  message_preview: string;
  
  created_at: string;
  approved_at?: string;
  published_at?: string;
  
  // Tracking
  clicks: number;
  registrations: number;
  payments: number;
  
  // Metadata
  confidence: number;
  reasoning: string;
  metadata: Record<string, unknown>;
}

// ─── Eventos de Conversión ───────────────────────────────────────────────────

export type ConversionEventType =
  | 'MOMENT_DETECTED'
  | 'SUGGESTION_APPROVED'
  | 'SUGGESTION_PUBLISHED'
  | 'LINK_CLICKED'
  | 'REGISTRATION_STARTED'
  | 'REGISTRATION_COMPLETED'
  | 'PAYMENT_APPROVED'
  | 'MOMENT_EXPIRED';

export interface ConversionEvent {
  event_id: string;
  event_type: ConversionEventType;
  timestamp_utc_ms: number;
  
  moment_id?: string;
  suggestion_id?: string;
  publication_id?: string;
  user_id?: string;
  
  data: Record<string, unknown>;
}

// ─── Métricas ────────────────────────────────────────────────────────────────

export interface ConversionMetrics {
  total_moments_detected: number;
  moments_approved: number;
  moments_published: number;
  
  total_clicks: number;
  total_registrations: number;
  total_conversions: number;
  total_revenue: number;
  
  ctr: number; // clicks / impressions
  registration_rate: number; // registrations / clicks
  conversion_rate: number; // conversions / registrations
  revenue_per_publication: number;
  
  by_product: Record<ConversionProduct, { clicks: number; registrations: number; conversions: number }>;
  by_moment_type: Record<CommercialMomentType, { suggestions: number; conversions: number }>;
  by_day_of_week: Record<number, { suggestions: number; conversions: number }>;
  by_market_condition: Record<string, { suggestions: number; conversions: number }>;
}

// ─── Configuración ───────────────────────────────────────────────────────────

export interface TrustConversionConfig {
  enabled: boolean;
  test_only: boolean;
  
  // Límites
  max_promotions_per_week: number;
  max_consecutive_promotions: number;
  min_hours_between_promotions: number;
  max_promotional_ratio: number; // 0-1 (0.20 = 20%)
  
  // Momentos
  detect_winning_streaks: boolean;
  winning_streak_threshold: number; // min pips gained
  
  detect_notable_results: boolean;
  notable_result_threshold: number; // min pips
  
  detect_high_activity: boolean;
  high_activity_threshold: number; // min alerts in timeframe
  
  detect_engagement_peaks: boolean;
  
  // Tiempo
  timezone: string;
  active_hours_start: number;
  active_hours_end: number;
  
  // Productos default
  default_products: ConversionProduct[];
  
  // Aprobación
  require_approval: boolean; // false = auto-publish (solo en TEST)
  
  paused: boolean;
}

export const DEFAULT_CONFIG: TrustConversionConfig = {
  enabled: true,
  test_only: true,
  
  max_promotions_per_week: 2,
  max_consecutive_promotions: 1,
  min_hours_between_promotions: 48,
  max_promotional_ratio: 0.2,
  
  detect_winning_streaks: true,
  winning_streak_threshold: 100,
  
  detect_notable_results: true,
  notable_result_threshold: 50,
  
  detect_high_activity: true,
  high_activity_threshold: 5,
  
  detect_engagement_peaks: true,
  
  timezone: 'America/Mazatlan',
  active_hours_start: 8,
  active_hours_end: 22,
  
  default_products: ['PREMIUM_ALERTS', 'BOT'],
  
  require_approval: true,
  paused: false,
};
