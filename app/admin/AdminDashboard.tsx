'use client';

import { motion } from 'framer-motion';
import { BarChart3, Users, FileText, DollarSign, AlertCircle, TrendingUp, HelpCircle, Settings, LogOut, PieChart } from 'lucide-react';
import { useState } from 'react';
import AdminResumen from './components/AdminResumen';
import AdminUsuarios from './components/AdminUsuarios';
import AdminSolicitudes from './components/AdminSolicitudes';
import AdminPagos from './components/AdminPagos';
import AdminAlertas from './components/AdminAlertas';
import AdminResultados from './components/AdminResultados';
import AdminSoporte from './components/AdminSoporte';
import AdminConfiguracion from './components/AdminConfiguracion';
import AdminUtilidades from './components/AdminUtilidades';
import { ToastProvider } from './components/Toast';

type TabType = 'resumen' | 'usuarios' | 'solicitudes' | 'pagos' | 'alertas' | 'resultados' | 'soporte' | 'configuracion' | 'utilidades';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  const tabs: TabConfig[] = [
    { id: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-5 h-5" />, component: <AdminResumen /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" />, component: <AdminUsuarios /> },
    { id: 'solicitudes', label: 'Solicitudes', icon: <FileText className="w-5 h-5" />, component: <AdminSolicitudes /> },
    { id: 'pagos', label: 'Pagos', icon: <DollarSign className="w-5 h-5" />, component: <AdminPagos /> },
    { id: 'alertas', label: 'Alertas', icon: <AlertCircle className="w-5 h-5" />, component: <AdminAlertas /> },
    { id: 'resultados', label: 'Resultados', icon: <TrendingUp className="w-5 h-5" />, component: <AdminResultados /> },
    { id: 'utilidades', label: 'Utilidades', icon: <PieChart className="w-5 h-5" />, component: <AdminUtilidades /> },
    { id: 'soporte', label: 'Soporte', icon: <HelpCircle className="w-5 h-5" />, component: <AdminSoporte /> },
    { id: 'configuracion', label: 'Config', icon: <Settings className="w-5 h-5" />, component: <AdminConfiguracion /> },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);

  return (
    <ToastProvider>
      <main className="min-h-screen bg-[#05070B] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gradient-to-b from-[#0B111A] to-[#05070B] sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#D4AF37]">CARVIPIX Admin</h1>
            <p className="text-xs text-white/50 mt-1">Panel administrativo privado</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-white/10 bg-white/5 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        {activeTabConfig && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTabConfig.component}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 mt-20 py-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <p className="font-semibold text-white mb-2">Panel Admin</p>
              <p className="text-white/60">Gestión privada de CARVIPIX</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Datos</p>
              <p className="text-white/60">Todos los datos mostrados son de demostración</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Seguridad</p>
              <p className="text-white/60">Acceso restringido solo para administradores</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/50">
              © 2026 CARVIPIX Admin. Panel de administración privado. Datos demo.
            </p>
          </div>
        </div>
      </footer>
    </main>
    </ToastProvider>
  );
}
