// Tipos para alertas

export type AlertType = "signal" | "risk" | "news" | "technical";
export type AlertStatus = "active" | "triggered" | "resolved" | "archived";
export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  type: AlertType;
  symbol: string;
  title: string;
  description: string;
  priority: AlertPriority;
  status: AlertStatus;
  timestamp: Date;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  condition: string; // Preparado para futura lógica compleja
  symbols: string[];
  alertTypes: AlertType[];
  createdAt: Date;
}

export interface AlertHistory {
  id: string;
  userId: string;
  alertId: string;
  action: "viewed" | "dismissed" | "triggered";
  timestamp: Date;
}
