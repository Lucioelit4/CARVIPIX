// Servicio para Capital de Inversores delegado al Backend Enterprise

import { CapitalAccount, CapitalMovement, MonthlyReport, InvestorStats } from "./types";
import { ecosystemServices } from "@/app/backend";

export class CapitalService {
  // Obtener cuenta de capital del usuario
  async getCapitalAccount(userId: string): Promise<CapitalAccount | null> {
    return ecosystemServices.capital.getCapitalAccount(userId);
  }

  // Obtener movimientos de la cuenta
  async getCapitalMovements(accountId: string): Promise<CapitalMovement[]> {
    return ecosystemServices.capital.getCapitalMovements(accountId);
  }

  // Obtener reportes mensuales
  async getMonthlyReports(accountId: string): Promise<MonthlyReport[]> {
    return ecosystemServices.capital.getMonthlyReports(accountId);
  }

  // Crear nueva cuenta de capital
  async createCapitalAccount(userId: string, initialCapital: number): Promise<CapitalAccount> {
    return ecosystemServices.capital.createCapitalAccount(userId, initialCapital);
  }

  // Obtener estadísticas de inversores (solo datos agregados)
  async getInvestorStats(): Promise<InvestorStats> {
    return ecosystemServices.capital.getInvestorStats();
  }

  // Nota: La lógica real de trading y cálculo de utilidades
  // NO se expone aquí. Permanece privada en el servidor.

  setDemoMode(_isDemoMode: boolean) {
    // No-op: la fuente de datos oficial es Backend Enterprise.
  }
}

export const capitalService = new CapitalService();
