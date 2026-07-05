'use client';

import { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminGuard from '@/app/components/AdminGuard';
import { clearAuthSession, getCurrentRole } from '@/app/lib/auth/session';
import { CARVIPIXLoadingState, spacing } from '@/app/design-system';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getCurrentRole() === 'admin');
  const [isLoading] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4">
        <div style={{ width: '100%', maxWidth: '34rem', paddingTop: spacing[16], paddingBottom: spacing[16] }}>
          <CARVIPIXLoadingState title="Cargando panel" message="Validando sesión administrativa." />
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
