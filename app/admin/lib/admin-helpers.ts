// Admin localStorage helper
// Gestiona datos operativos del panel admin usando localStorage

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

// Estado inicial vacio para evitar datos mock en administracion
const defaultAdminData: AdminData = {
  solicitudes: [],
  pagos: [],
  alertas: [],
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

// Restaurar estado inicial sin datos pre-cargados
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

// Crear nueva alerta desde panel admin
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
