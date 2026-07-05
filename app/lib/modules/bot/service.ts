// Servicio para Bot CARVIPIX delegado al Backend Enterprise

import { BotLicense, BotInstance, BotUpdate } from "./types";
import { ecosystemServices } from "@/app/backend";

export class BotService {
  // Obtener licencia
  async getLicense(userId: string): Promise<BotLicense | null> {
    return ecosystemServices.bot.getLicense(userId);
  }

  // Verificar si licencia es válida
  async isLicenseValid(userId: string): Promise<boolean> {
    const license = await this.getLicense(userId);
    return license?.active ?? false;
  }

  // Obtener instancias del bot
  async getBotInstances(userId: string): Promise<BotInstance[]> {
    return ecosystemServices.bot.getBotInstances(userId);
  }

  // Crear nueva instancia del bot
  async createBotInstance(userId: string, instance: Omit<BotInstance, "id" | "userId" | "createdAt" | "stats">): Promise<BotInstance> {
    return ecosystemServices.bot.createBotInstance(userId, instance);
  }

  // Obtener últimas actualizaciones disponibles
  async getAvailableUpdates(): Promise<BotUpdate[]> {
    return ecosystemServices.bot.getAvailableUpdates();
  }

  // Conectar broker a instancia del bot
  async connectBroker(botId: string, brokerType: "MT4" | "MT5", credentials: {
    server: string;
    login: string;
    password: string;
  }): Promise<boolean> {
    return ecosystemServices.bot.connectBroker(botId, brokerType, credentials);
  }

  setDemoMode(_isDemoMode: boolean) {
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const botService = new BotService();
