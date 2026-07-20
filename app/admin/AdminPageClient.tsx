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
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('admin_recovery_token');
    if (token) {
      setRecoveryToken(token);
      setResetMessage('Enlace verificado. Define tu nueva contraseña admin.');
    }

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

  const handleResetCode = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextCode = newCode.trim();
    const repeatedCode = confirmCode.trim();

    if (!recoveryToken) {
      setResetMessage('No se encontró token de recuperación válido.');
      return;
    }

    if (nextCode.length < 8) {
      setResetMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nextCode !== repeatedCode) {
      setResetMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsResetting(true);
    setResetMessage('Guardando nueva contraseña...');

    try {
      const response = await fetch('/api/auth/admin/recovery/reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoveryToken, newCode: nextCode }),
      });

      if (!response.ok) {
        setResetMessage('No se pudo actualizar la contraseña. Solicita un nuevo enlace.');
        return;
      }

      setResetMessage('Contraseña actualizada correctamente. Entrando al panel admin...');
      setRecoveryToken(null);
      setIsAuthenticated(true);

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('admin_recovery_token');
      window.history.replaceState({}, '', nextUrl.toString());
    } catch {
      setResetMessage('Error de red al actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setIsResetting(false);
    }
  };

  if (recoveryToken && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] to-[#030303] p-6 space-y-4">
          <h1 className="text-2xl font-bold">Cambiar contraseña admin</h1>
          <p className="text-sm text-white/70">Este enlace es privado y expira en pocos minutos.</p>
          <form onSubmit={handleResetCode} className="space-y-3">
            <input
              type="password"
              placeholder="Nueva contraseña admin"
              value={newCode}
              onChange={(event) => setNewCode(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
              disabled={isResetting}
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmCode}
              onChange={(event) => setConfirmCode(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white"
              disabled={isResetting}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-[#D4AF37] text-black font-semibold py-2 disabled:opacity-60"
              disabled={isResetting}
            >
              {isResetting ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
          {resetMessage ? <p className="text-sm text-emerald-300">{resetMessage}</p> : null}
        </div>
      </main>
    );
  }

  return isAuthenticated ? (
    <AdminDashboard onLogout={handleLogout} />
  ) : (
    <AdminLogin onLogin={handleLogin} />
  );
}
