export interface CadpConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
}

export interface CadpConversationState {
  conversation_id: string;
  analysis_id: string;
  symbol: string;
  created_at: string;
  updated_at: string;
  messages: CadpConversationMessage[];
}

export class CadpConversationManager {
  private readonly map = new Map<string, CadpConversationState>();

  start(input: { conversationId: string; analysisId: string; symbol: string }): CadpConversationState {
    const existing = this.map.get(input.conversationId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const state: CadpConversationState = {
      conversation_id: input.conversationId,
      analysis_id: input.analysisId,
      symbol: input.symbol,
      created_at: now,
      updated_at: now,
      messages: [],
    };
    this.map.set(input.conversationId, state);
    return state;
  }

  append(input: { conversationId: string; role: CadpConversationMessage["role"]; content: string }): CadpConversationState | null {
    const current = this.map.get(input.conversationId);
    if (!current) {
      return null;
    }

    current.messages.push({
      role: input.role,
      content: input.content,
      created_at: new Date().toISOString(),
    });
    current.updated_at = new Date().toISOString();
    return current;
  }

  get(conversationId: string): CadpConversationState | null {
    return this.map.get(conversationId) ?? null;
  }
}
