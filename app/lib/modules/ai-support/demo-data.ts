// Datos demo para Soporte IA

import { AIConversation, AIBriefing, AISuggestion } from "./types";

export const DEMO_AI_CONVERSATION: AIConversation = {
  id: "conv-demo-001",
  userId: "demo-user-001",
  assistantRole: "trader",
  title: "Análisis de tendencia EURUSD",
  messages: [
    {
      id: "msg-001",
      role: "user",
      content: "¿Cuál es tu análisis para EURUSD en el gráfico de 4h?",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "msg-002",
      role: "assistant",
      content: "Analizo el gráfico de 4h de EURUSD. Observo: 1) Confirmación de soporte en 1.0850. 2) RSI en zona neutral (45-55). 3) MACD positivo pero sin cruce. Recomendación: Esperar confirmación en 1.0900 para entrada en largo.",
      timestamp: new Date(Date.now() - 3500000),
    },
  ],
  createdAt: new Date(Date.now() - 3600000),
  updatedAt: new Date(Date.now() - 3500000),
};

export const DEMO_AI_BRIEFING: AIBriefing = {
  id: "brief-demo-001",
  userId: "demo-user-001",
  generatedAt: new Date(),
  content: `Briefing de hoy:

Alertas generadas: 5
- EURUSD: Soporte confirmado
- GBPUSD: Volatilidad esperada por BOE
- USDJPY: Divergencia RSI en 4h
- AUDUSD: Ruptura de resistencia
- NZDUSD: Comunicado RBNZ

Oportunidades identificadas:
1. EURUSD: Entrada en 1.0850 (soporte)
2. AUDUSD: Seguir ruptura alcista

Nivel de riesgo: MEDIO
- Volatilidad de mercado moderada
- Eventos macroeconómicos importantes hoy`,
  highlights: {
    alertsToday: 5,
    recommendedActions: [
      "Monitorear EURUSD en soporte 1.0850",
      "Esperar confirmación antes de entradas",
      "Cuidado con noticias BOE y RBNZ",
    ],
    riskLevel: "medium",
  },
};

export const DEMO_AI_SUGGESTIONS: AISuggestion[] = [
  {
    category: "opportunity",
    suggestion: "EURUSD formando triángulo ascendente. Potencial ruptura en próximas 4h.",
    confidence: 78,
  },
  {
    category: "risk",
    suggestion: "GBPUSD con alto riesgo por comunicado BOE. Considerar reducir posiciones.",
    confidence: 85,
  },
  {
    category: "trade",
    suggestion: "AUDUSD rompió resistencia. Entrada en cierre de vela con TP 0.6850.",
    confidence: 72,
  },
];

export function getDemoAIConversation(): AIConversation {
  return {
    ...DEMO_AI_CONVERSATION,
    messages: DEMO_AI_CONVERSATION.messages.map(m => ({ ...m })),
  };
}

export function getDemoAIBriefing(): AIBriefing {
  return {
    ...DEMO_AI_BRIEFING,
    highlights: { ...DEMO_AI_BRIEFING.highlights },
  };
}

export function getDemoAISuggestions(): AISuggestion[] {
  return DEMO_AI_SUGGESTIONS.map(s => ({ ...s }));
}
