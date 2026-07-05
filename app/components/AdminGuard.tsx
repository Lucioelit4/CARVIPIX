'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getAuthSessionSnapshot, getCurrentRole, logAccessEvent } from '@/app/lib/auth/session';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Componente protegido que verifica autenticación admin
 * Si no está autenticado, muestra acceso denegado
 * Si está expirado, permite reintentar login
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isExpired } = useMemo(() => {
    const snapshot = getAuthSessionSnapshot();
    const session = snapshot.session;

    if (!session) {
      if (snapshot.status === 'expired') {
        logAccessEvent('admin_session_expired', 'La sesión administrativa expiró antes de cargar el panel.');
        return { isAuthenticated: false, isExpired: true };
      }
      return { isAuthenticated: false, isExpired: false };
    }

    if (session.role !== 'admin') {
      logAccessEvent('admin_access_denied', 'Intento de acceso a /admin con rol no autorizado.');
      return { isAuthenticated: false, isExpired: false };
    }

    return { isAuthenticated: true, isExpired: false };
  }, []);

  // Autenticado: mostrar contenido
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // No autenticado: mostrar acceso denegado
  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-6"
          >
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-white/60">
            {isExpired
              ? 'Tu sesión de administrador ha expirado.'
              : getCurrentRole() === 'cliente'
                ? 'Tu cuenta actual no tiene permisos de administración.'
                : 'No tienes permisos para acceder a esta área.'}
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] to-[#030303] p-8 shadow-2xl shadow-[#D4AF37]/10"
        >
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">
              {isExpired
                ? 'Solo administradores autenticados pueden acceder a esta sección. Por favor, inicia sesión nuevamente.'
                : 'Solo administradores autenticados pueden acceder a esta sección. Si crees que esto es un error, contacta con soporte.'}
            </p>
          </div>

          <div className="space-y-3">
            {isExpired && (
              <Link href="/admin" className="block">
                <button className="w-full px-4 py-3 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] transition duration-200">
                  Iniciar sesión nuevamente
                </button>
              </Link>
            )}

            <Link href="/">
              <button className="w-full px-4 py-3 rounded-lg border border-white/10 text-white font-medium hover:border-white/20 hover:bg-white/5 transition duration-200 flex items-center justify-center gap-2">
                <ChevronLeft size={16} />
                Volver al inicio
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-white/40 mt-8"
        >
          CARVIPIX © 2026 - Área administrativa privada
        </motion.p>
      </motion.div>
    </main>
  );
}
