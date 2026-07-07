'use client';

import { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import { clearAuthSession } from '@/app/lib/auth/session';

interface AdminPageClientProps {
  initialIsAuthenticated: boolean;
}

export default function AdminPageClient({ initialIsAuthenticated }: AdminPageClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch('/api/auth/admin/session', { cache: 'no-store' });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    void validateSession();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/session', { method: 'DELETE' });
    } catch {
      // No-op: local cleanup is still applied below.
    }
    clearAuthSession();
    setIsAuthenticated(false);
  };

  return isAuthenticated ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
    <AdminLogin onLogin={handleLogin} />
  );
}
