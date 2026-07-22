/**
 * GET /api/internal/observer-v3/[analysisId]
 * Returns full analysis detail including all 16 sections, prompt, response, dispatch matrix
 */

import { NextRequest, NextResponse } from "next/server";
import { analysisStore } from "@/app/ai/cadpV2/analysisStore";
import { isSameOriginRequest } from "@/app/api/admin/_shared/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DispatchDestinationResult = {
  module?: string;
  status?: string;
  timestamp_utc_ms?: number;
  detail?: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> },
) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const { analysisId } = await params;
    const analysis = analysisStore.getById(analysisId);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 },
      );
    }

    // Build dispatch matrix (9 destinations)
    const dispatchMatrix = analysis.dispatch_result
      ? (analysis.dispatch_result.destinations as unknown as DispatchDestinationResult[]).map((result) => ({
          destination: result.module ?? 'unknown',
          status: result.status,
          timestamp_utc_ms: result.timestamp_utc_ms,
          detail: result.detail,
        }))
      : [];

    return NextResponse.json({
      timestamp_utc_ms: Date.now(),
      success: true,
      analysis: {
        // Identifiers
        analysis_id: analysis.analysis_id,
        signal_id: analysis.signal_id,
        canonical_symbol: analysis.canonical_symbol,
        timestamp_utc_ms: analysis.timestamp_utc_ms,
        trigger_reason: analysis.trigger_reason,
        status: analysis.status,
        skip_reason: analysis.skip_reason,

        // Expediente (16 sections)
        expediente: {
          identity: analysis.expediente?.identity,
          quality: analysis.expediente?.quality,
          pre_analysis_trigger: analysis.expediente?.pre_analysis_trigger,
          previous_context: analysis.expediente?.previous_context,
          delta: analysis.expediente?.delta,
          market_h1: {
            ema20: analysis.expediente?.market_h1?.ema20,
            ema50: analysis.expediente?.market_h1?.ema50,
            ema200: analysis.expediente?.market_h1?.ema200,
            adx: analysis.expediente?.market_h1?.adx,
            atr: analysis.expediente?.market_h1?.atr,
            ema_order: analysis.expediente?.market_h1?.ema_order,
            closed_candles_count: analysis.expediente?.market_h1?.closed_candles?.length ?? 0,
          },
          market_m30: {
            ema20: analysis.expediente?.market_m30?.ema20,
            ema50: analysis.expediente?.market_m30?.ema50,
            ema_order: analysis.expediente?.market_m30?.ema_order,
            closed_candles_count: analysis.expediente?.market_m30?.closed_candles?.length ?? 0,
          },
          market_m5: {
            ema20: analysis.expediente?.market_m5?.ema20,
            ema50: analysis.expediente?.market_m5?.ema50,
            ema_order: analysis.expediente?.market_m5?.ema_order,
            closed_candles_count: analysis.expediente?.market_m5?.closed_candles?.length ?? 0,
          },
          multi_timeframe: analysis.expediente?.multi_timeframe,
          volatility_and_session: {
            market_session: (analysis.expediente?.volatility_and_session as { market_session?: string })?.market_session,
            volatility_ratio: (analysis.expediente?.volatility_and_session as { volatility_ratio?: number })?.volatility_ratio,
          },
          news_and_risk: {
            news_status: analysis.expediente?.news_and_risk?.news_status,
            events_within_window: analysis.expediente?.news_and_risk?.events_within_operation_window?.length ?? 0,
          },
          narrative_context: {
            price_situation: analysis.expediente?.narrative_context?.price_situation?.slice(0, 300),
            h1_facts: analysis.expediente?.narrative_context?.h1_facts?.slice(0, 300),
          },
          executive_summary: {
            one_line: analysis.expediente?.executive_summary?.one_line,
            attention_items: analysis.expediente?.executive_summary?.attention_items?.length ?? 0,
            missing_items: analysis.expediente?.executive_summary?.missing_items?.length ?? 0,
          },
        },

        // Prompt & Pregunta Maestra
        prompt_text_length: analysis.prompt_text.length,
        estimated_tokens: analysis.estimated_tokens,
        pregunta_maestra: analysis.pregunta_maestra?.slice(0, 500),

        // OpenAI Response
        master_decision: {
          decision: analysis.respuesta_maestra?.master_decision?.decision,
          direction: analysis.respuesta_maestra?.master_decision?.direction,
          probability_estimated: analysis.respuesta_maestra?.master_decision?.probability_estimated,
          conviction: analysis.respuesta_maestra?.master_decision?.conviction,
        },
        decision_contract: {
          decision: analysis.respuesta_maestra?.decision,
          direction: analysis.respuesta_maestra?.direction,
          horizon: analysis.respuesta_maestra?.horizon,
          quality: analysis.respuesta_maestra?.quality,
          confidence: analysis.respuesta_maestra?.confidence,
          entry_price: analysis.respuesta_maestra?.entry_price,
          stop_loss: analysis.respuesta_maestra?.stop_loss,
          take_profit: analysis.respuesta_maestra?.take_profit,
          risk_reward: analysis.respuesta_maestra?.risk_reward,
          critical_veto: analysis.respuesta_maestra?.critical_veto,
          missing_condition: analysis.respuesta_maestra?.missing_condition,
          technical_explanation: analysis.respuesta_maestra?.technical_explanation,
          public_explanation: analysis.respuesta_maestra?.public_explanation,
        },
        analysis_private: analysis.respuesta_maestra?.analysis_private?.analysis_summary?.slice(0, 500),
        factors_pro: analysis.respuesta_maestra?.analysis_private?.decisive_evidence?.slice(0, 3),
        factors_con: analysis.respuesta_maestra?.analysis_private?.opposing_evidence?.slice(0, 3),
        main_risk: analysis.respuesta_maestra?.analysis_private?.primary_risk,
        missing_condition: analysis.respuesta_maestra?.analysis_private?.missing_condition,
        analyst_note: analysis.respuesta_maestra?.analyst_observations?.summary,

        // Adaptive State
        adaptive_state: {
          proximity_to_entry: analysis.respuesta_maestra?.adaptive_state?.proximity_to_entry,
          recheck_minutes: analysis.respuesta_maestra?.adaptive_state?.recheck_minutes,
          scenario_classification: analysis.respuesta_maestra?.adaptive_state?.scenario_classification,
          watch_conditions: analysis.respuesta_maestra?.adaptive_state?.watch_conditions?.slice(0, 3),
          missing_for_entry: analysis.respuesta_maestra?.adaptive_state?.missing_for_entry?.slice(0, 3),
        },

        // Order Plan
        order_plan: {
          entry_price: analysis.respuesta_maestra?.order_plan?.entry_price,
          take_profit: analysis.respuesta_maestra?.order_plan?.take_profit,
          stop_loss: analysis.respuesta_maestra?.order_plan?.stop_loss,
          risk_reward_ratio: analysis.respuesta_maestra?.order_plan?.risk_reward_ratio,
        },

        // Metadata
        response_latency_ms: analysis.response_latency_ms,
        response_cost_usd: analysis.response_cost_usd,
        response_valid: analysis.response_valid,
        response_errors: analysis.response_errors,

        // Dispatch Matrix (9 destinations)
        dispatch_matrix: dispatchMatrix,
        dispatch_delivered: dispatchMatrix.filter((d) => d.status === "DELIVERED").length,

        // Paper Trading
        paper_trade_opened: analysis.paper_trade_opened
          ? {
              direction: analysis.paper_trade_opened.direction,
              entry_price: analysis.paper_trade_opened.entry_price,
              tp: analysis.paper_trade_opened.tp,
              sl: analysis.paper_trade_opened.sl,
            }
          : null,
        paper_balance_before_usd: analysis.paper_balance_before_usd,
        paper_balance_after_usd: analysis.paper_balance_after_usd,
        paper_pnl_usd: analysis.paper_pnl_usd,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
