'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { writeAuthSession } from '@/app/lib/auth/session';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async () => {
    if (loading) {
      return;
    }

    setError('');
    setLoading(true);
    let shouldStopLoading = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const requestedPath = params.get('next') ?? '/dashboard';
      const redirectPath = requestedPath.startsWith('/') ? requestedPath : '/dashboard';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        requiresVerification?: boolean;
        success?: boolean;
      };

      if (!response.ok) {
        if (result.requiresVerification) {
          setError('Debes verificar tu correo antes de iniciar sesión.');
        } else {
          setError(result.error || 'No se pudo iniciar sesión.');
        }
        return;
      }

      if (result.success === false) {
        setError(result.error || 'No se pudo iniciar sesión.');
        return;
      }

      writeAuthSession('cliente');

      const sessionValidation = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!sessionValidation.ok) {
        window.location.replace('/servicios');
        return;
      }

      const sessionPayload = (await sessionValidation.json().catch(() => ({}))) as {
        authenticated?: boolean;
        membership?: { active?: boolean };
      };

      if (!sessionPayload.authenticated) {
        window.location.replace('/servicios');
        return;
      }

      shouldStopLoading = false;
      const protectedMembershipPath = /^\/(alertas|resultados|analisis|comunidad|bot|capital|fondeo|herramientas)(\/|$)/.test(redirectPath);
      const nextPath = !sessionPayload.membership?.active && protectedMembershipPath ? '/dashboard' : redirectPath;
      window.location.replace(nextPath);
    } catch {
      setError('No se pudo iniciar sesión.');
    } finally {
      if (shouldStopLoading) {
        setLoading(false);
      }
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitLogin();
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-white sm:text-4xl">Acceso CARVIPIX</h1>
        <p className="mb-8 text-center text-sm text-white/70 sm:text-base">Inicia sesión para acceder a tu Dashboard.</p>

        <div className="grid gap-4">
          <CARVIPIXCard variant="default" padding="24" hover>
            <div className="mb-3 inline-flex rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">Inicio de sesión</h2>

            <form className="space-y-3" onSubmit={onSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo"
                className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm"
                disabled={loading}
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm"
                disabled={loading}
                required
              />
              {error ? <p className="text-xs text-red-400">{error}</p> : null}
              <CARVIPIXButton type="submit" variant="premium" fullWidth disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </CARVIPIXButton>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs">
              <Link href="/registro" className="text-[#D4AF37]">Crear cuenta</Link>
              <Link href="/recuperar-password" className="text-white/70">Recuperar contraseña</Link>
            </div>
          </CARVIPIXCard>
        </div>
      </div>
    </main>
  );
}
