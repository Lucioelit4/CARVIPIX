// Datos demo para alertas

import { Alert, AlertRule } from "./types";

export const DEMO_ALERTS: Alert[] = [
  {
    id: "alert-001",
    type: "signal",
    symbol: "EURUSD",
    title: "Señal de compra confirmada",
    description: "Confirmación de soporte en nivel 1.0850 con volumen creciente",
    priority: "high",
    status: "active",
    timestamp: new Date(Date.now() - 15 * 60000),
    data: { price: 1.0855, resistance: 1.0900, support: 1.0800 },
  },
  {
    id: "alert-002",
    type: "risk",
    symbol: "GBPUSD",
    title: "Advertencia de volatilidad",
    description: "Volatilidad esperada debido a dato macroeconómico",
    priority: "medium",
    status: "active",
    timestamp: new Date(Date.now() - 45 * 60000),
    data: { event: "BOE Interest Rate", time: "14:00 GMT" },
  },
  {
    id: "alert-003",
    type: "technical",
    symbol: "USDJPY",
    title: "Divergencia RSI detectada",
    description: "Divergencia bajista en RSI de 4h",
    priority: "medium",
    status: "active",
    timestamp: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: "alert-004",
    type: "signal",
    symbol: "AUDUSD",
    title: "Ruptura de nivel de resistencia",
    description: "AUDUSD rompe resistencia en 0.6800",
    priority: "critical",
    status: "active",
    timestamp: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "alert-005",
    type: "news",
    symbol: "NZDUSD",
    title: "Dato macroeconómico importante",
    description: "Comunicado RBNZ sobre decisión de tasas",
    priority: "high",
    status: "active",
    timestamp: new Date(Date.now() - 30 * 60000),
  },
];

export const DEMO_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-001",
    userId: "demo-user-001",
    name: "Niveles de Soporte",
    enabled: true,
    condition: "price <= support_level",
    symbols: ["EURUSD", "GBPUSD", "USDJPY"],
    alertTypes: ["signal"],
    createdAt: new Date(2024, 0, 1),
  },
  {
    id: "rule-002",
    userId: "demo-user-001",
    name: "Volatilidad Alta",
    enabled: true,
    condition: "volatility > threshold",
    symbols: ["EURUSD", "GBPUSD"],
    alertTypes: ["risk"],
    createdAt: new Date(2024, 0, 15),
  },
];

export function getDemoAlerts(): Alert[] {
  return DEMO_ALERTS.map(a => ({ ...a }));
}

export function getDemoAlertRules(): AlertRule[] {
  return DEMO_ALERT_RULES.map(r => ({ ...r }));
}
