// Servicio para Bot CARVIPIX (preparado para conectar licencias y broker)

import { BotLicense, BotInstance, BotUpdate } from "./types";
import { getDemoBotLicense, getDemoBotInstance, getLatestBotUpdate } from "./demo-data";

export class BotService {
  private isDemoMode = true;
  private botInstances: BotInstance[] = [getDemoBotInstance()];

  // Obtener licencia
  async getLicense(userId: string): Promise<BotLicense | null> {
    if (this.isDemoMode) {
      return getDemoBotLicense();
    }
    // FUTURE: Validar contra servidor de licencias
    // const response = await fetch(`/api/bot/license/${userId}`);
    // if (response.ok) return response.json();
    // return null;
    throw new Error("Servidor de licencias no conectado");
  }

  // Verificar si licencia es válida
  async isLicenseValid(userId: string): Promise<boolean> {
    const license = await this.getLicense(userId);
    return license?.active ?? false;
  }

  // Obtener instancias del bot
  async getBotInstances(userId: string): Promise<BotInstance[]> {
    if (this.isDemoMode) {
      return this.botInstances.filter(b => b.userId === userId);
    }
    // FUTURE: Obtener desde base de datos
    throw new Error("API no conectada todavía");
  }

  // Crear nueva instancia del bot
  async createBotInstance(userId: string, instance: Omit<BotInstance, "id" | "userId" | "createdAt" | "stats">): Promise<BotInstance> {
    const newInstance: BotInstance = {
      ...instance,
      id: `bot-${Date.now()}`,
      userId,
      createdAt: new Date(),
      stats: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profitLoss: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
      },
    };

    if (this.isDemoMode) {
      this.botInstances.push(newInstance);
    }
    // FUTURE: Guardar en base de datos y conectar con broker

    return newInstance;
  }

  // Obtener últimas actualizaciones disponibles
  async getAvailableUpdates(): Promise<BotUpdate[]> {
    if (this.isDemoMode) {
      return [getLatestBotUpdate()];
    }
    // FUTURE: Conectar con servidor de actualizaciones
    throw new Error("API no conectada todavía");
  }

  // Conectar broker a instancia del bot
  async connectBroker(botId: string, brokerType: "MT4" | "MT5", credentials: {
    server: string;
    login: string;
    password: string;
  }): Promise<boolean> {
    // FUTURE: Validar credenciales contra broker
    // const response = await fetch(`/api/bot/${botId}/connect-broker`, {
    //   method: 'POST',
    //   body: JSON.stringify({ brokerType, credentials })
    // });
    // return response.ok;

    if (this.isDemoMode) {
      // Simular conexión exitosa en demo
      return true;
    }

    throw new Error("Broker no conectado todavía");
  }

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const botService = new BotService();
