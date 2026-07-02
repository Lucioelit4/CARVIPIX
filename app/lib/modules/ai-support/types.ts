// Tipos para Soporte IA

export type AIAssistantRole = "analyzer" | "educator" | "trader" | "support";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  assistantRole: AIAssistantRole;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIBriefing {
  id: string;
  userId: string;
  generatedAt: Date;
  content: string;
  highlights: {
    alertsToday: number;
    recommendedActions: string[];
    riskLevel: "low" | "medium" | "high";
  };
}

export interface AISuggestion {
  category: "trade" | "risk" | "opportunity" | "news";
  suggestion: string;
  confidence: number; // 0-100
}
