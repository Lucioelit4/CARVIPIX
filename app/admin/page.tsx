'use client';

import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminGuard from '@/app/components/AdminGuard';
import { clearAuthSession, getCurrentRole } from '@/app/lib/auth/session';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(getCurrentRole() === 'admin');

    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthSession();
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
    isAuthenticated ? (
      <AdminGuard>
        <AdminDashboard onLogout={handleLogout} />
      </AdminGuard>
    ) : (
      <AdminLogin onLogin={handleLogin} />
    )
  );
}
