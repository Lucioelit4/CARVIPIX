// Servicio de alertas (preparado para bot real)

import { Alert, AlertRule, AlertHistory } from "./types";
import { getDemoAlerts, getDemoAlertRules } from "./demo-data";

export class AlertsService {
  private isDemoMode = true;
  private alertHistory: AlertHistory[] = [];

  // Obtener alertas del usuario
  async getAlerts(userId: string, limit?: number): Promise<Alert[]> {
    let alerts = this.isDemoMode ? getDemoAlerts() : [];

    // FUTURE: Conectar a bot real para obtener alertas en vivo
    // const response = await fetch(`/api/alerts?user=${userId}`);
    // return response.json();

    return limit ? alerts.slice(0, limit) : alerts;
  }

  // Obtener reglas de alertas
  async getAlertRules(userId: string): Promise<AlertRule[]> {
    if (this.isDemoMode) {
      return getDemoAlertRules().filter(r => r.userId === userId);
    }
    // FUTURE: Conectar a base de datos de reglas
    throw new Error("API no conectada todavía");
  }

  // Crear regla de alerta
  async createAlertRule(userId: string, rule: Omit<AlertRule, "id" | "userId" | "createdAt">): Promise<AlertRule> {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      userId,
      createdAt: new Date(),
    };

    // FUTURE: Guardar en base de datos y notificar al adaptador del bot
    // Esta regla será usada por el bot en vivo para generar alertas

    return newRule;
  }

  // Registrar acción en historial
  async logAlertAction(userId: string, alertId: string, action: "viewed" | "dismissed" | "triggered"): Promise<void> {
    const historyEntry: AlertHistory = {
      id: `history-${Date.now()}`,
      userId,
      alertId,
      action,
      timestamp: new Date(),
    };

    this.alertHistory.push(historyEntry);
    // FUTURE: Guardar en base de datos
  }

  // Obtener estadísticas de alertas
  async getAlertStats(userId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    resolved: number;
  }> {
    const alerts = await this.getAlerts(userId);
    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === "active").length,
      triggered: alerts.filter(a => a.status === "triggered").length,
      resolved: alerts.filter(a => a.status === "resolved").length,
    };
  }

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const alertsService = new AlertsService();
