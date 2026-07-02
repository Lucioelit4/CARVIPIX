// Tipos para Capital de Inversores

export type CapitalStatus = "pending" | "active" | "paused" | "closed";
export type MovementType = "deposit" | "withdrawal" | "profit" | "fee";

export interface CapitalAccount {
  accountId: string;
  userId: string;
  initialCapital: number;
  currentBalance: number;
  utilidad: number;
  participacionCliente: number; // 60%
  participacionCARVIPIX: number; // 40%
  status: CapitalStatus;
  fechaInicio: Date;
  monthlyReturn: number; // % monthly
  annualReturn: number; // % annual
}

export interface CapitalMovement {
  id: string;
  accountId: string;
  type: MovementType;
  amount: number;
  fecha: Date;
  description: string;
  balanceAfter: number;
}

export interface MonthlyReport {
  accountId: string;
  mes: string;
  capitalInicial: number;
  capitalFinal: number;
  utilidad: number;
  participacionCliente: number;
  participacionCARVIPIX: number;
  rendimiento: number;
}

export interface InvestorStats {
  totalCapitalManaged: number;
  totalInvestors: number;
  avgReturn: number;
  topMonth: {
    month: string;
    return: number;
  };
}
