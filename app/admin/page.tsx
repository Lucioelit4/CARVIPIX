'use client';

import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminGuard from '@/app/components/AdminGuard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión admin guardada en localStorage
    const adminSession = localStorage.getItem('carvipix_admin_session');
    const adminTimestamp = localStorage.getItem('carvipix_admin_timestamp');

    if (adminSession && adminTimestamp) {
      // Sesión válida por 24 horas
      const sessionTime = parseInt(adminTimestamp);
      const currentTime = Date.now();
      const hoursIn24 = 24 * 60 * 60 * 1000;

      if (currentTime - sessionTime < hoursIn24) {
        setIsAuthenticated(true);
      } else {
        // Sesión expirada
        localStorage.removeItem('carvipix_admin_session');
        localStorage.removeItem('carvipix_admin_timestamp');
      }
    }

    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('carvipix_admin_session');
    localStorage.removeItem('carvipix_admin_timestamp');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#05070B] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <AdminGuard>
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </AdminGuard>
  );
}
