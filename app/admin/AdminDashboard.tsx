'use client';

import { motion } from 'framer-motion';
import { Activity, BarChart3, Users, FileText, DollarSign, AlertCircle, TrendingUp, HelpCircle, Settings, LogOut, PieChart, GitBranch, Zap, Send, Database, Microscope, ShieldCheck, LayoutDashboard, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminResumen from './components/AdminResumen';
import AdminUsuarios from './components/AdminUsuarios';
import AdminSolicitudes from './components/AdminSolicitudes';
import AdminPagos from './components/AdminPagos';
import AdminMembresias from './components/AdminMembresias';
import AdminAlertas from './components/AdminAlertas';
import AdminResultados from './components/AdminResultados';
import AdminSoporte from './components/AdminSoporte';
import AdminConfiguracion from './components/AdminConfiguracion';
import AdminUtilidades from './components/AdminUtilidades';
import AdminCumplimiento from './components/AdminCumplimiento';
import AdminProyecto from './components/AdminProyecto';
import AdminMotor from './components/AdminMotor';
import AdminBot from './components/AdminBot';
import AdminBacktesting from './components/AdminBacktesting';
import AdminDataHealth from './components/AdminDataHealth';
import AdminSistema from './components/AdminSistema';
import AdminComunicaciones from './components/AdminComunicaciones';
import { ToastProvider } from './components/Toast';
import { CARVIPIXButton } from '../design-system';
import DataSourceBanner from '@/app/components/DataSourceBanner';

type TabType = 'resumen' | 'sistema' | 'proyecto' | 'motor' | 'bot' | 'backtesting' | 'datos' | 'usuarios' | 'membresias' | 'solicitudes' | 'pagos' | 'alertas' | 'resultados' | 'soporte' | 'comunicaciones' | 'cumplimiento' | 'configuracion' | 'utilidades';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [isEnteringClientPanel, setIsEnteringClientPanel] = useState(false);
  const [clientPanelError, setClientPanelError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['resumen', 'sistema', 'proyecto', 'motor', 'bot', 'backtesting', 'datos', 'usuarios', 'membresias', 'solicitudes', 'pagos', 'alertas', 'resultados', 'soporte', 'comunicaciones', 'cumplimiento', 'configuracion', 'utilidades'].includes(tabParam)) {
      queueMicrotask(() => {
        setActiveTab(tabParam);
      });
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  const handleEnterClientPanel = async () => {
    setClientPanelError(null);
    setIsEnteringClientPanel(true);

    try {
      const response = await fetch('/api/admin/client-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setClientPanelError('No se pudo habilitar el acceso al panel de clientes.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setClientPanelError('No se pudo habilitar el acceso al panel de clientes.');
    } finally {
      setIsEnteringClientPanel(false);
    }
  };

  const tabs: TabConfig[] = [
    { id: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-5 h-5" />, component: <AdminResumen /> },
    { id: 'sistema', label: 'Sistema', icon: <Activity className="w-5 h-5" />, component: <AdminSistema /> },
    { id: 'proyecto', label: 'Proyecto', icon: <GitBranch className="w-5 h-5" />, component: <AdminProyecto /> },
    { id: 'motor', label: 'Motor', icon: <Zap className="w-5 h-5" />, component: <AdminMotor /> },
    { id: 'bot', label: 'Bot', icon: <Send className="w-5 h-5" />, component: <AdminBot /> },
    { id: 'backtesting', label: 'Backtesting', icon: <Microscope className="w-5 h-5" />, component: <AdminBacktesting /> },
    { id: 'datos', label: 'Datos', icon: <Database className="w-5 h-5" />, component: <AdminDataHealth isAdmin={true} /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-5 h-5" />, component: <AdminUsuarios /> },
    { id: 'membresias', label: 'Membresías', icon: <ShieldCheck className="w-5 h-5" />, component: <AdminMembresias /> },
    { id: 'solicitudes', label: 'Socios Estratégicos', icon: <FileText className="w-5 h-5" />, component: <AdminSolicitudes /> },
    { id: 'pagos', label: 'Pagos', icon: <DollarSign className="w-5 h-5" />, component: <AdminPagos /> },
    { id: 'alertas', label: 'Alertas', icon: <AlertCircle className="w-5 h-5" />, component: <AdminAlertas /> },
    { id: 'resultados', label: 'Resultados', icon: <TrendingUp className="w-5 h-5" />, component: <AdminResultados /> },
    { id: 'utilidades', label: 'Utilidades', icon: <PieChart className="w-5 h-5" />, component: <AdminUtilidades /> },
    { id: 'soporte', label: 'Soporte', icon: <HelpCircle className="w-5 h-5" />, component: <AdminSoporte /> },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: <Mail className="w-5 h-5" />, component: <AdminComunicaciones /> },
    { id: 'cumplimiento', label: 'Cumplimiento', icon: <ShieldCheck className="w-5 h-5" />, component: <AdminCumplimiento /> },
    { id: 'configuracion', label: 'Config', icon: <Settings className="w-5 h-5" />, component: <AdminConfiguracion /> },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab);

  return (
    <ToastProvider>
      <main className="min-h-screen bg-[#030303] text-white">
      <div className="mx-auto max-w-7xl px-6 pt-4 sm:px-8">
        <DataSourceBanner />
      </div>
      {/* Header */}
      <header className="border-b border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#D4AF37]">CARVIPIX Admin</h1>
            <p className="text-xs text-white/50 mt-1">Panel administrativo privado</p>
          </div>
          <div className="flex items-center gap-3">
            <CARVIPIXButton
              onClick={handleEnterClientPanel}
              variant="secondary"
              size="sm"
              isLoading={isEnteringClientPanel}
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Entrar al Panel de Clientes
            </CARVIPIXButton>
            <CARVIPIXButton onClick={onLogout} variant="ghost" size="sm" leftIcon={<LogOut className="w-4 h-4" />}>
              Cerrar sesión
            </CARVIPIXButton>
          </div>
        </div>
        {clientPanelError && (
          <div className="mx-auto max-w-7xl px-6 pb-3 sm:px-8">
            <p className="text-xs text-red-400">{clientPanelError}</p>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-white/10 bg-white/5 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
              <p className="text-white/60">Los paneles muestran datos reales o el estado de integración disponible en cada módulo</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Seguridad</p>
              <p className="text-white/60">Acceso restringido solo para administradores</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/50">
              © 2026 CARVIPIX Admin. Panel de administración privado.
            </p>
          </div>
        </div>
      </footer>
    </main>
    </ToastProvider>
  );
}
