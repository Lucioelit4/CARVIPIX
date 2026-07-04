'use client';

import { useState, useEffect } from 'react';
import { getAuthSessionSnapshot, getCurrentRole, logAccessEvent } from '@/app/lib/auth/session';

/**
 * Hook para verificar si el usuario actual es administrador
 * Revisa la sesión admin guardada en localStorage
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const snapshot = getAuthSessionSnapshot();
    const session = snapshot.session;

    if (!session) {
      if (snapshot.status === 'expired') {
        logAccessEvent('admin_session_expired', 'La sesión administrativa expiró en la validación del menú.');
      }
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    if (session.role !== 'admin') {
      if (getCurrentRole() !== 'invitado') {
        logAccessEvent('admin_access_denied', 'Rol sin permisos de administración.');
      }
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setIsAdmin(true);

    setIsLoading(false);
  }, []);

  return { isAdmin, isLoading };
}
