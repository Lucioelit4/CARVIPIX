// Datos demo para Capital de Inversores

import { CapitalAccount, CapitalMovement, MonthlyReport } from "./types";

export const DEMO_CAPITAL_ACCOUNT: CapitalAccount = {
  accountId: "capital-demo-001",
  userId: "demo-user-001",
  initialCapital: 25000,
  currentBalance: 29340,
  utilidad: 4340,
  participacionCliente: 2604, // 60% de 4340
  participacionCARVIPIX: 1736, // 40% de 4340
  status: "active",
  fechaInicio: new Date(2024, 0, 1),
  monthlyReturn: 3.2,
  annualReturn: 38.4,
};

export const DEMO_CAPITAL_MOVEMENTS: CapitalMovement[] = [
  {
    id: "mov-001",
    accountId: "capital-demo-001",
    type: "deposit",
    amount: 25000,
    fecha: new Date(2024, 0, 1),
    description: "Depósito inicial",
    balanceAfter: 25000,
  },
  {
    id: "mov-002",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1250,
    fecha: new Date(2024, 0, 15),
    description: "Utilidad mes enero",
    balanceAfter: 26250,
  },
  {
    id: "mov-003",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1850,
    fecha: new Date(2024, 1, 15),
    description: "Utilidad mes febrero",
    balanceAfter: 28100,
  },
  {
    id: "mov-004",
    accountId: "capital-demo-001",
    type: "profit",
    amount: 1240,
    fecha: new Date(2024, 2, 15),
    description: "Utilidad mes marzo",
    balanceAfter: 29340,
  },
];

export const DEMO_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    accountId: "capital-demo-001",
    mes: "Enero 2024",
    capitalInicial: 25000,
    capitalFinal: 26250,
    utilidad: 1250,
    participacionCliente: 750,
    participacionCARVIPIX: 500,
    rendimiento: 5.0,
  },
  {
    accountId: "capital-demo-001",
    mes: "Febrero 2024",
    capitalInicial: 26250,
    capitalFinal: 28100,
    utilidad: 1850,
    participacionCliente: 1110,
    participacionCARVIPIX: 740,
    rendimiento: 7.04,
  },
  {
    accountId: "capital-demo-001",
    mes: "Marzo 2024",
    capitalInicial: 28100,
    capitalFinal: 29340,
    utilidad: 1240,
    participacionCliente: 744,
    participacionCARVIPIX: 496,
    rendimiento: 4.41,
  },
];

export function getDemoCapitalAccount(): CapitalAccount {
  return {
    ...DEMO_CAPITAL_ACCOUNT,
  };
}

export function getDemoCapitalMovements(): CapitalMovement[] {
  return DEMO_CAPITAL_MOVEMENTS.map(m => ({ ...m }));
}

export function getDemoMonthlyReports(): MonthlyReport[] {
  return DEMO_MONTHLY_REPORTS.map(r => ({ ...r }));
}
