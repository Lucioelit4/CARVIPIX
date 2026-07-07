// Servicio de alertas (preparado para bot real)

import { Alert, AlertRule } from "./types";
import { ecosystemServices } from "@/app/backend";

export class AlertsService {
  // Obtener alertas del usuario
  async getAlerts(userId: string, limit?: number): Promise<Alert[]> {
    const serviceAlerts = await ecosystemServices.alerts.getAlerts({ userId, limit });
    return serviceAlerts.map((item) => ({
      id: item.id,
      type: item.type,
      symbol: item.symbol,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      timestamp: item.timestamp,
      actionUrl: item.actionUrl,
      data: item.data,
    }));
  }

  // Obtener reglas de alertas
  async getAlertRules(userId: string): Promise<AlertRule[]> {
    return ecosystemServices.alerts.getAlertRules(userId);
  }

  // Crear regla de alerta
  async createAlertRule(userId: string, rule: Omit<AlertRule, "id" | "userId" | "createdAt">): Promise<AlertRule> {
    return ecosystemServices.alerts.createAlertRule(userId, rule);
  }

  // Registrar acción en historial
  async logAlertAction(userId: string, alertId: string, action: "viewed" | "dismissed" | "triggered"): Promise<void> {
    await ecosystemServices.alerts.logAlertAction(userId, alertId, action);
  }

  // Obtener estadísticas de alertas
  async getAlertStats(userId: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    resolved: number;
  }> {
    return ecosystemServices.alerts.getAlertStats(userId);
  }

  setDemoMode(_isDemoMode: boolean) {
    void _isDemoMode;
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const alertsService = new AlertsService();
