// Servicio para Capital de Inversores (preparado para conectar estrategias reales)

import { CapitalAccount, CapitalMovement, MonthlyReport, InvestorStats } from "./types";
import { getDemoCapitalAccount, getDemoCapitalMovements, getDemoMonthlyReports } from "./demo-data";

export class CapitalService {
  private isDemoMode = true;
  private accounts: CapitalAccount[] = [getDemoCapitalAccount()];

  // Obtener cuenta de capital del usuario
  async getCapitalAccount(userId: string): Promise<CapitalAccount | null> {
    const account = this.isDemoMode
      ? this.accounts.find(a => a.userId === userId)
      : null;

    if (account) return { ...account };

    // FUTURE: Obtener desde base de datos y broker real
    // const response = await fetch(`/api/capital/account/${userId}`);
    // if (response.ok) return response.json();
    // return null;

    throw new Error("API de capital no conectada todavía");
  }

  // Obtener movimientos de la cuenta
  async getCapitalMovements(accountId: string): Promise<CapitalMovement[]> {
    if (this.isDemoMode) {
      return getDemoCapitalMovements().filter(m => m.accountId === accountId);
    }

    // FUTURE: Obtener desde base de datos
    throw new Error("API no conectada todavía");
  }

  // Obtener reportes mensuales
  async getMonthlyReports(accountId: string): Promise<MonthlyReport[]> {
    if (this.isDemoMode) {
      return getDemoMonthlyReports().filter(r => r.accountId === accountId);
    }

    // FUTURE: Obtener desde base de datos
    throw new Error("API no conectada todavía");
  }

  // Crear nueva cuenta de capital
  async createCapitalAccount(userId: string, initialCapital: number): Promise<CapitalAccount> {
    const account: CapitalAccount = {
      accountId: `capital-${Date.now()}`,
      userId,
      initialCapital,
      currentBalance: initialCapital,
      utilidad: 0,
      participacionCliente: 0,
      participacionCARVIPIX: 0,
      status: "pending",
      fechaInicio: new Date(),
      monthlyReturn: 0,
      annualReturn: 0,
    };

    if (this.isDemoMode) {
      this.accounts.push(account);
    }

    // FUTURE: Guardar en base de datos
    // FUTURE: Integrar con broker para crear cuenta

    return account;
  }

  // Obtener estadísticas de inversores (solo datos agregados)
  async getInvestorStats(): Promise<InvestorStats> {
    return {
      totalCapitalManaged: 150000, // Suma de todas las cuentas
      totalInvestors: 12,
      avgReturn: 4.2, // Promedio mensual
      topMonth: {
        month: "Febrero 2024",
        return: 7.04,
      },
    };
  }

  // Nota: La lógica real de trading y cálculo de utilidades
  // NO se expone aquí. Permanece privada en el servidor.

  setDemoMode(isDemoMode: boolean) {
    this.isDemoMode = isDemoMode;
  }
}

export const capitalService = new CapitalService();
