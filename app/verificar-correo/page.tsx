'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

function VerificarCorreoContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams?.get('token') || '';
  const hasToken = tokenFromUrl.length > 0;
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>(hasToken ? 'idle' : 'error');
  const [message, setMessage] = useState(
    hasToken
      ? 'Validando tu enlace de verificación...'
      : 'No encontramos un enlace válido de verificación. Solicita uno nuevo desde tu cuenta.'
  );

  useEffect(() => {
    if (!tokenFromUrl) {
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'No pudimos validar tu correo en este momento. Inténtalo nuevamente.');
          return;
        }

        setStatus('ok');
        setMessage(data.message || 'Correo verificado correctamente. Ya puedes iniciar sesión.');
      } catch {
        setStatus('error');
        setMessage('No pudimos validar tu correo en este momento. Inténtalo nuevamente.');
      }
    };

    void verify();
  }, [tokenFromUrl]);

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-3xl font-bold">Verificación de correo</h1>
        <p className="mb-8 text-center text-sm text-white/70">Confirmación de cuenta CARVIPIX</p>
        <CARVIPIXCard variant="default" padding="24" hover={false}>
          <p className={status === 'error' ? 'text-sm text-red-400' : 'text-sm text-emerald-400'}>{message}</p>
          <div className="mt-4">
            <Link href="/login">
              <CARVIPIXButton variant="premium" fullWidth>Ir a login</CARVIPIXButton>
            </Link>
          </div>
        </CARVIPIXCard>
      </div>
    </main>
  );
}

export default function VerificarCorreoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl">
            <h1 className="mb-2 text-center text-3xl font-bold">Verificación de correo</h1>
            <p className="mb-8 text-center text-sm text-white/70">Confirmación de cuenta CARVIPIX</p>
            <CARVIPIXCard variant="default" padding="24" hover={false}>
              <p className="text-sm text-white/70">Validando tu enlace de verificación...</p>
            </CARVIPIXCard>
          </div>
        </main>
      }
    >
      <VerificarCorreoContent />
    </Suspense>
  );
}
