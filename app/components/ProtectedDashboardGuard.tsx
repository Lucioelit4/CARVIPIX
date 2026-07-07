'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { getCurrentRole, writeAuthSession } from '@/app/lib/auth/session';

interface ProtectedDashboardGuardProps {
  children: React.ReactNode;
}

const PROTECTED_PREFIXES = [
  '/alertas',
  '/resultados',
  '/analisis',
  '/comunidad',
  '/bot',
  '/capital',
  '/fondeo',
  '/herramientas',
  '/perfil',
  '/soporte',
  '/gestion-capital',
  '/gestion-de-capital',
];

function isProtectedDashboardPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function ProtectedDashboardGuard({ children }: ProtectedDashboardGuardProps) {
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (!isProtectedDashboardPath(pathname)) {
        setIsAllowed(true);
        return;
      }

      const currentRole = getCurrentRole();
      if (currentRole === 'admin') {
        setIsAllowed(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          setIsAllowed(false);
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { authenticated?: boolean; membership?: { active?: boolean } };
        if (data.authenticated && data.membership?.active) {
          writeAuthSession('cliente');
          setIsAllowed(true);
          return;
        }
      } catch {
        // No-op: denial fallback applied below.
      }

      setIsAllowed(false);
    };

    void validate();
  }, [pathname]);

  if (isAllowed === null) {
    return null;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] to-[#030303] p-8 shadow-2xl shadow-[#D4AF37]/10">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-white/60">
            El dashboard privado está disponible solo para clientes y administradores.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/servicios" className="block">
            <button className="w-full px-4 py-3 rounded-lg bg-[#D4AF37] text-black font-bold hover:bg-[#E5C158] transition duration-200 flex items-center justify-center gap-2">
              <LayoutDashboard size={16} />
              Ver servicios
            </button>
          </Link>

          <Link href="/" className="block">
            <button className="w-full px-4 py-3 rounded-lg border border-white/10 text-white font-medium hover:border-white/20 hover:bg-white/5 transition duration-200 flex items-center justify-center gap-2">
              <ChevronLeft size={16} />
              Volver al inicio
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}