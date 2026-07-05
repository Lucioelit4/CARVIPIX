'use client';

import { useIsAdmin } from '@/app/hooks/useIsAdmin';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useSyncExternalStore } from 'react';

interface AdminMenuItemProps {
  onNavigate?: () => void;
  compact?: boolean;
}

/**
 * Componente de menú para acceso a panel admin
 * Solo aparece en el DOM si el usuario tiene rol administrador
 */
export default function AdminMenuItem({ onNavigate, compact = false }: AdminMenuItemProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { isAdmin, isLoading } = useIsAdmin();
  const pathname = usePathname();

  // Evita desajuste SSR/cliente: renderizar solo tras hidratación.
  if (!isHydrated) {
    return null;
  }

  // No renderizar nada mientras está cargando ni si no es admin
  if (isLoading || !isAdmin) {
    return null;
  }

  // Verificar si estamos en la página /admin
  const isActive = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={`group relative flex min-h-[44px] items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition duration-200 ${
        isActive
          ? "border-l-4 border-[#D4AF37] bg-white/5 text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.1)]"
          : "text-zinc-300 hover:border-l-4 hover:border-[#D4AF37]/50 hover:bg-white/5 hover:text-[#D4AF37]"
      } ${compact ? 'text-sm' : 'text-[15px] leading-5'}`}
      title="Área de administradores"
    >
      <ShieldCheck size={18} className="flex-shrink-0" />
      <span className="flex-1">Área de Administradores</span>
      {isActive ? <span className="h-2 w-2 rounded-full bg-[#D4AF37]" /> : null}
    </Link>
  );
}
