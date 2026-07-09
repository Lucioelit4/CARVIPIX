'use client';

import { useMemo } from 'react';
import { getAuthSessionSnapshot } from '@/app/lib/auth/session';

/**
 * Hook para verificar si el usuario actual es administrador
 * Revisa la sesión admin guardada en localStorage
 */
export function useIsAdmin() {
  const isAdmin = useMemo(() => {
    const snapshot = getAuthSessionSnapshot();
    const session = snapshot.session;

    if (!session) {
      return false;
    }

    return session.role === 'admin';
  }, []);

  return { isAdmin, isLoading: false };
}
