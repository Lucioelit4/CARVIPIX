'use client';

import { useIsAdmin } from '@/app/hooks/useIsAdmin';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { CARVIPIXButtonLink } from '@/app/design-system';

/**
 * Componente que muestra un botón "Área de Administradores" solo si el usuario es admin
 * Se integra en el Header de forma discreta
 */
export default function AdminNavButton() {
  const { isAdmin, isLoading } = useIsAdmin();

  // No renderizar nada mientras está cargando
  if (isLoading) {
    return null;
  }

  // Solo mostrar si es admin
  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CARVIPIXButtonLink
        href="/admin"
        variant="secondary"
        size="md"
        className="gap-2"
        aria-label="Panel de administración"
        title="Panel de administración"
        leftIcon={<ShieldCheck size={16} />}
      >
        <span className="hidden sm:inline">Administración</span>
        <span className="inline sm:hidden">Admin</span>
      </CARVIPIXButtonLink>
    </motion.div>
  );
}
