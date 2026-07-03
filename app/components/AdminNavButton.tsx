'use client';

import { useIsAdmin } from '@/app/hooks/useIsAdmin';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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
      <Link href="/admin">
        <button
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-medium text-sm hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition duration-200"
          title="Panel de administración"
        >
          <ShieldCheck size={16} />
          <span className="hidden sm:inline">Administración</span>
          <span className="inline sm:hidden">Admin</span>
        </button>
      </Link>
    </motion.div>
  );
}
