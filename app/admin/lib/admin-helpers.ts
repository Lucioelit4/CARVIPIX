import { getCommercialProductById } from "@/app/lib/commercial/business-model";

// Admin localStorage helper
// Gestiona datos demo del panel admin usando localStorage

const ADMIN_DATA_KEY = 'carvipix_admin_data';

interface AdminSolicitud {
  id: string;
  usuario: string;
  producto: string;
  monto?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'contactado';
  fecha: string;
}

interface AdminPago {
  id: string;
  fecha: string;
  cliente: string;
  producto: string;
  monto: string;
  metodo: string;
  estado: 'completado' | 'pendiente' | 'fallido';
}

interface AdminAlerta {
  id: string;
  symbol: string;
  tipo: string;
  estado: 'activa' | 'ganada' | 'perdida' | 'seguimiento';
  entrada: string;
  tp: string;
  sl: string;
  fecha: string;
}

interface AdminData {
  solicitudes: AdminSolicitud[];
  pagos: AdminPago[];
  alertas: AdminAlerta[];
  timestamp: number;
}

function formatCommercialAmount(productId: string): string {
  const product = getCommercialProductById(productId);
  const amount = product?.priceUsd;
  if (typeof amount !== "number") {
    return "N/A";
  }

  return `$${amount.toFixed(2)}`;
}

function commercialName(productId: string, fallback: string): string {
  return getCommercialProductById(productId)?.name ?? fallback;
}

// Datos iniciales demo
const defaultAdminData: AdminData = {
  solicitudes: [
    { id: 'SOL-2847', usuario: 'Juan Pérez', producto: 'Capital Gestionado', monto: '$50,000', estado: 'pendiente', fecha: '2026-07-02' },
    { id: 'SOL-2846', usuario: 'María García', producto: 'Fondeo de Cuenta', monto: 'N/A', estado: 'aprobado', fecha: '2026-07-02' },
    { id: 'SOL-2845', usuario: 'Carlos López', producto: 'Capital Gestionado', monto: '$25,000', estado: 'rechazado', fecha: '2026-07-01' },
    { id: 'SOL-2844', usuario: 'Ana Martínez', producto: 'Bot CARVIPIX', monto: 'N/A', estado: 'aprobado', fecha: '2026-07-01' },
    { id: 'SOL-2843', usuario: 'Roberto Silva', producto: 'Fondeo de Cuenta', monto: 'N/A', estado: 'pendiente', fecha: '2026-06-30' },
  ],
  pagos: [
    { id: 'ORD-20260702001', fecha: '2026-07-02 14:32', cliente: 'Juan Pérez', producto: commercialName('plan-advanced', 'Plan PRO'), monto: formatCommercialAmount('plan-advanced'), metodo: 'Tarjeta', estado: 'completado' },
    { id: 'ORD-20260702002', fecha: '2026-07-02 13:15', cliente: 'María García', producto: commercialName('bot-carvipix-license', 'Bot CARVIPIX'), monto: formatCommercialAmount('bot-carvipix-license'), metodo: 'Crypto', estado: 'completado' },
    { id: 'ORD-20260702003', fecha: '2026-07-02 11:42', cliente: 'Carlos López', producto: 'Capital Gestionado', monto: '$50,000.00', metodo: 'Transferencia', estado: 'pendiente' },
    { id: 'ORD-20260701001', fecha: '2026-07-01 16:20', cliente: 'Ana Martínez', producto: commercialName('plan-advanced', 'Plan PRO'), monto: formatCommercialAmount('plan-advanced'), metodo: 'Tarjeta', estado: 'completado' },
    { id: 'ORD-20260701002', fecha: '2026-07-01 14:10', cliente: 'Roberto Silva', producto: commercialName('bot-carvipix-license', 'Bot CARVIPIX'), monto: formatCommercialAmount('bot-carvipix-license'), metodo: 'Crypto', estado: 'completado' },
  ],
  alertas: [
    { id: 'XAUUSD-1432', symbol: 'XAUUSD', tipo: 'Compra', estado: 'ganada', entrada: '2338.45', tp: '2345.00', sl: '2332.00', fecha: '2026-07-02 14:32' },
    { id: 'BTCUSD-1428', symbol: 'BTCUSD', tipo: 'Compra', estado: 'seguimiento', entrada: '61520.00', tp: '62880.00', sl: '60780.00', fecha: '2026-07-02 14:28' },
    { id: 'EURUSD-1355', symbol: 'EURUSD', tipo: 'Venta', estado: 'seguimiento', entrada: '1.07153', tp: '1.06900', sl: '1.07320', fecha: '2026-07-02 13:55' },
    { id: 'GBPUSD-1215', symbol: 'GBPUSD', tipo: 'Venta', estado: 'ganada', entrada: '1.26840', tp: '1.26200', sl: '1.27200', fecha: '2026-07-02 12:15' },
    { id: 'USDJPY-1045', symbol: 'USDJPY', tipo: 'Compra', estado: 'perdida', entrada: '157.32', tp: '158.50', sl: '156.80', fecha: '2026-07-01 10:45' },
  ],
  timestamp: Date.now(),
};

// Obtener datos del admin desde localStorage
export function getAdminData(): AdminData {
  if (typeof window === 'undefined') return defaultAdminData;

  try {
    const data = localStorage.getItem(ADMIN_DATA_KEY);
    return data ? JSON.parse(data) : { ...defaultAdminData };
  } catch (error) {
    console.error('Error reading admin data:', error);
    return { ...defaultAdminData };
  }
}

// Guardar datos del admin en localStorage
export function saveAdminData(data: AdminData): void {
  if (typeof window === 'undefined') return;

  try {
    data.timestamp = Date.now();
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving admin data:', error);
  }
}

// Restaurar datos demo originales
export function resetAdminData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(ADMIN_DATA_KEY);
  } catch (error) {
    console.error('Error resetting admin data:', error);
  }
}

// Actualizar estado de solicitud
export function updateSolicitud(id: string, nuevoEstado: AdminSolicitud['estado']): boolean {
  const data = getAdminData();
  const solicitud = data.solicitudes.find((s) => s.id === id);

  if (solicitud) {
    solicitud.estado = nuevoEstado;
    saveAdminData(data);
    return true;
  }
  return false;
}

// Actualizar estado de pago
export function updatePago(id: string, nuevoEstado: AdminPago['estado']): boolean {
  const data = getAdminData();
  const pago = data.pagos.find((p) => p.id === id);

  if (pago) {
    pago.estado = nuevoEstado;
    saveAdminData(data);
    return true;
  }
  return false;
}

// Actualizar estado de alerta
export function updateAlerta(id: string, nuevoEstado: AdminAlerta['estado']): boolean {
  const data = getAdminData();
  const alerta = data.alertas.find((a) => a.id === id);

  if (alerta) {
    alerta.estado = nuevoEstado;
    saveAdminData(data);
    return true;
  }
  return false;
}

// Crear nueva alerta demo
export function createAlerta(alerta: Omit<AdminAlerta, 'id'>): AdminAlerta {
  const data = getAdminData();
  const newAlerta: AdminAlerta = {
    ...alerta,
    id: `CUSTOM-${Date.now()}`,
  };
  data.alertas.unshift(newAlerta);
  saveAdminData(data);
  return newAlerta;
}
