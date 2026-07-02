// Servicio para Soporte IA (preparado para conectar modelos reales)

import { AIConversation, AIBriefing, AISuggestion, AIMessage } from "./types";
import { getDemoAIConversation, getDemoAIBriefing, getDemoAISuggestions } from "./demo-data";

export class AISupportService {
  private isDemoMode = true;
  private conversations: AIConversation[] = [getDemoAIConversation()];

  // Obtener conversaciones del usuario
  async getConversations(userId: string): Promise<AIConversation[]> {
    if (this.isDemoMode) {
      return this.conversations.filter(c => c.userId === userId);
    }

    // FUTURE: Obtener desde base de datos
    throw new Error("API no conectada todavía");
  }

  // Obtener briefing diario
  async getDailyBriefing(userId: string): Promise<AIBriefing> {
    if (this.isDemoMode) {
      return getDemoAIBriefing();
    }

    // FUTURE: Generar con IA real
    // Agregar información de:
    // - Alertas del día
    // - Posiciones abiertas
    // - Eventos macroeconómicos

    throw new Error("API no conectada todavía");
  }

  // Obtener sugerencias de trading
  async getTradingSuggestions(userId: string, context?: string): Promise<AISuggestion[]> {
    if (this.isDemoMode) {
      return getDemoAISuggestions();
    }

    // FUTURE: Generar recomendaciones con modelo IA
    // Basadas en análisis técnico, noticias, posiciones abiertas, etc.

    throw new Error("API no conectada todavía");
  }

  // Enviar mensaje al asistente
  async sendMessage(conversationId: string, userMessage: string): Promise<AIMessage> {
    const message: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    if (this.isDemoMode) {
      // Simular respuesta en demo
      const conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.messages.push(message);
        // En demo, no agrega respuesta automáticamente
      }
    }

    // FUTURE: Enviar a modelo IA real
    // const response = await fetch(`/api/ai/chat/${conversationId}`, {
    //   method: 'POST',
    //   body: JSON.stringify({ message: userMessage })
    // });

    return message;
  }

  // Crear nueva conversación
  async createConversation(userId: string, title: string, role: "analyzer" | "educator" | "trader" | "support"): Promise<AIConversation> {
    const conversation: AIConversation = {
      id: `conv-${Date.now()}`,
      userId,
      assistantRole: role,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isDemoMode) {
      this.conversations.push(conversation);
    }

    // FUTURE: Guardar en base de datos

    return conversation;
  }

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const aiSupportService = new AISupportService();
