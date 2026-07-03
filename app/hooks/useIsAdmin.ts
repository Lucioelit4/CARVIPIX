'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para verificar si el usuario actual es administrador
 * Revisa la sesión admin guardada en localStorage
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión admin válida en localStorage
    const adminSession = localStorage.getItem('carvipix_admin_session');
    const adminTimestamp = localStorage.getItem('carvipix_admin_timestamp');

    if (adminSession && adminTimestamp) {
      // Sesión válida por 24 horas
      const sessionTime = parseInt(adminTimestamp);
      const currentTime = Date.now();
      const hoursIn24 = 24 * 60 * 60 * 1000;

      if (currentTime - sessionTime < hoursIn24) {
        setIsAdmin(true);
      } else {
        // Sesión expirada
        localStorage.removeItem('carvipix_admin_session');
        localStorage.removeItem('carvipix_admin_timestamp');
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }

    setIsLoading(false);
  }, []);

  return { isAdmin, isLoading };
}
