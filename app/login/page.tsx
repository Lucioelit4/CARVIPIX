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
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const submitLogin = async () => {
    if (loading) {
      return;
    }

    setError('');
    setInfo('');
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
        verificationUrl?: string;
      };

      if (!response.ok) {
        if (result.requiresVerification) {
          setError('Debes verificar tu correo antes de iniciar sesion. Puedes reenviar el correo de verificacion.');
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
        if (sessionValidation.status === 401 || sessionValidation.status === 403) {
          setError('No se pudo validar la sesión. Intenta nuevamente.');
          return;
        }

        window.location.replace('/dashboard');
        return;
      }

      const sessionPayload = (await sessionValidation.json().catch(() => ({}))) as {
        authenticated?: boolean;
        membership?: { active?: boolean };
      };

      if (!sessionPayload.authenticated) {
        setError('No se pudo validar la sesión. Intenta nuevamente.');
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

  const resendVerification = async () => {
    if (!email || resendingVerification) {
      return;
    }

    setResendingVerification(true);
    setInfo('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json().catch(() => ({}))) as { message?: string; error?: string; verificationUrl?: string };

      if (!response.ok) {
        setError(result.error || 'No se pudo reenviar el correo.');
        return;
      }

      setInfo(result.message || 'Si la cuenta existe y no esta verificada, enviaremos instrucciones.');
    } catch {
      setError('No se pudo reenviar el correo.');
    } finally {
      setResendingVerification(false);
    }
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
              {info ? <p className="text-xs text-emerald-400">{info}</p> : null}
              {error.includes('verificar') ? (
                <button
                  type="button"
                  onClick={() => void resendVerification()}
                  disabled={resendingVerification || !email}
                  className="w-full rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendingVerification ? 'Reenviando...' : 'Reenviar correo de verificacion'}
                </button>
              ) : null}
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
