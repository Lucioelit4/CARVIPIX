import type { AIAnalysisResponse, AIClientMessageCode } from "./types";

const CATALOG: Record<AIClientMessageCode, string> = {
  BUY_NOW: "COMPRA YA",
  SELL_NOW: "VENDE YA",
  WAIT_CONFIRMATION: "ESPERAR",
  DO_NOT_ENTER: "NO ENTRAR",
  ENTRY_MISSED: "ENTRADA PERDIDA",
  HIGH_RISK: "ALTO RIESGO",
  SETUP_INVALIDATED: "NO ENTRAR",
  DATA_UNAVAILABLE: "DATOS INSUFICIENTES",
};

export function renderClientMessage(response: AIAnalysisResponse): string {
  return CATALOG[response.client_message_code] ?? "DATOS INSUFICIENTES";
}
