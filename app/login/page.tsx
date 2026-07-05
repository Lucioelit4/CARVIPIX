'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { getCurrentRole } from '@/app/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getCurrentRole();

    if (role === 'admin') {
      router.replace('/admin');
      return;
    }

    if (role === 'cliente') {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-white sm:text-4xl">Acceso CARVIPIX</h1>
        <p className="mb-8 text-center text-sm text-white/70 sm:text-base">
          Selecciona tu flujo de acceso. Esta vista reutiliza la sesión real ya definida en la plataforma.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <CARVIPIXCard variant="default" padding="24" hover>
            <div className="mb-3 inline-flex rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Acceso cliente</h2>
            <p className="mb-5 text-sm text-white/70">
              Ingresa al dashboard principal para operar módulos de usuario.
            </p>
            <Link href="/dashboard" className="block">
              <CARVIPIXButton variant="premium" fullWidth>
                Continuar como cliente
              </CARVIPIXButton>
            </Link>
          </CARVIPIXCard>

          <CARVIPIXCard variant="admin" padding="24" hover>
            <div className="mb-3 inline-flex rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2">
              <LockKeyhole className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Acceso administrativo</h2>
            <p className="mb-5 text-sm text-white/70">
              Redirección al panel administrativo con validación de acceso correspondiente.
            </p>
            <Link href="/admin" className="block">
              <CARVIPIXButton variant="secondary" fullWidth>
                Ir al panel admin
              </CARVIPIXButton>
            </Link>
          </CARVIPIXCard>
        </div>
      </div>
    </main>
  );
}
