'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

export default function RecuperarPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const isResetMode = token.length > 0;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(isResetMode ? '/api/auth/reset-password' : '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isResetMode ? { token, password } : { email }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string; resetUrl?: string };

      if (!response.ok) {
        setError(data.error || 'No se pudo procesar la solicitud.');
        return;
      }

      if (isResetMode) {
        setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
        setPassword('');
      } else {
        setMessage(data.message || 'Solicitud procesada.');
        setResetUrl(data.resetUrl || '');
      }
    } catch {
      setError('No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-3xl font-bold">{isResetMode ? 'Restablecer contraseña' : 'Recuperar contraseña'}</h1>
        <p className="mb-8 text-center text-sm text-white/70">{isResetMode ? 'Ingresa una nueva contraseña.' : 'Te enviaremos un enlace para recuperar acceso.'}</p>
        <CARVIPIXCard variant="default" padding="24" hover={false}>
          <form className="space-y-3" onSubmit={onSubmit}>
            {isResetMode ? (
              <input type="password" className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Nueva contraseña (mínimo 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            ) : (
              <input type="email" className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            {message ? <p className="text-xs text-emerald-400">{message}</p> : null}
            {resetUrl ? (
              <p className="text-xs text-amber-300">
                Enlace de recuperación disponible: <a href={resetUrl} className="underline">abrir recuperación</a>
              </p>
            ) : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <CARVIPIXButton type="submit" variant="premium" fullWidth>{loading ? 'Procesando...' : (isResetMode ? 'Actualizar contraseña' : 'Enviar enlace')}</CARVIPIXButton>
          </form>
          <p className="mt-4 text-xs text-white/70"><Link href="/login" className="text-[#D4AF37]">Volver a login</Link></p>
        </CARVIPIXCard>
      </div>
    </main>
  );
}
