'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, KeyRound, Lock, XCircle } from 'lucide-react';
import { logAccessEvent, writeAuthSession } from '@/app/lib/auth/session';
import { CARVIPIXButton, CARVIPIXCard, CARVIPIXFormField } from '../design-system';

interface AdminLoginProps {
  onLogin: () => void;
}

type LoginStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';
type PasskeyOptionsResponse = {
  ok?: boolean;
  options?: {
    challenge?: string;
  } & Record<string, unknown>;
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleAdminLoginSuccess = () => {
    writeAuthSession('admin');
    logAccessEvent('admin_login', 'Inicio de sesión administrativo exitoso.');
    setStatus('success');
    setStatusMessage('Acceso correcto. Ingresando al panel administrativo...');
    setTimeout(() => {
      onLogin();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('Validando credenciales...');

    try {
      const response = await fetch('/api/auth/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        handleAdminLoginSuccess();
        return;
      }

      setStatus('denied');
      setStatusMessage('Acceso denegado. Verifica tus credenciales e intenta nuevamente.');
      setCode('');
    } catch {
      setStatus('error');
      setStatusMessage('Ocurrió un error al validar el acceso. Intenta de nuevo.');
    }
  };

  const handlePasskeyLogin = async () => {
    setStatus('loading');
    setStatusMessage('Abriendo acceso con passkey...');

    try {
      const optionsResponse = await fetch('/api/auth/admin/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!optionsResponse.ok) {
        setStatus('denied');
        setStatusMessage('Passkey no disponible para este entorno.');
        return;
      }

      const payload = (await optionsResponse.json().catch(() => ({}))) as PasskeyOptionsResponse;

      if (!payload.ok || !payload.options || typeof payload.options.challenge !== 'string') {
        setStatus('error');
        setStatusMessage('No se pudo iniciar passkey. Intenta nuevamente.');
        return;
      }

      const { startAuthentication } = await import('@simplewebauthn/browser');
      const webauthnResponse = await startAuthentication({
        optionsJSON: payload.options as Parameters<typeof startAuthentication>[0]['optionsJSON'],
      });

      const verifyResponse = await fetch('/api/auth/admin/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: webauthnResponse }),
      });

      if (verifyResponse.ok) {
        handleAdminLoginSuccess();
        return;
      }

      setStatus('denied');
      setStatusMessage('Passkey rechazada. Intenta de nuevo con tu teléfono o llave.');
    } catch {
      setStatus('error');
      setStatusMessage('No fue posible completar el acceso passkey.');
    }
  };

  const handleEmailRecovery = async () => {
    setStatus('loading');
    setStatusMessage('Enviando enlace de recuperación al correo del administrador...');

    try {
      await fetch('/api/auth/admin/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      setStatus('success');
      setStatusMessage('Si la recuperación está configurada, te enviamos un enlace al correo administrador.');
    } catch {
      setStatus('error');
      setStatusMessage('No se pudo iniciar la recuperación por correo.');
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6"
          >
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">CARVIPIX Admin</h1>
          <p className="text-white/60">Panel de administración privado</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className=""
        >
          <CARVIPIXCard variant="admin" padding="24" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input */}
            <CARVIPIXFormField label="Código de acceso">
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (status !== 'idle') {
                    setStatus('idle');
                    setStatusMessage('');
                  }
                }}
                placeholder="Ingresa el código"
                className={`w-full px-4 py-3 rounded-lg border-2 transition ${
                  status === 'denied' || status === 'error'
                    ? 'border-red-500/50 bg-red-500/10 text-white focus:border-red-400'
                    : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                } outline-none font-mono text-center text-lg tracking-widest`}
                disabled={status === 'loading' || status === 'success'}
              />
            </CARVIPIXFormField>

            {(status === 'loading' || status === 'success' || status === 'denied' || status === 'error') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  status === 'loading'
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
                    : status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {status === 'loading' && (
                  <div className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                )}
                {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {status === 'denied' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                {status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <p
                  className={`text-sm ${
                    status === 'loading'
                      ? 'text-[#E5C158]'
                      : status === 'success'
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {statusMessage}
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <CARVIPIXButton
              type="submit"
              disabled={status === 'loading' || status === 'success' || !code.trim()}
              variant={status === 'loading' || status === 'success' || !code.trim() ? 'disabled' : 'premium'}
              fullWidth
            >
              {status === 'loading' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : status === 'success' ? (
                'Acceso correcto'
              ) : (
                'Acceder al Panel'
              )}
            </CARVIPIXButton>

            <CARVIPIXButton
              type="button"
              onClick={() => void handlePasskeyLogin()}
              disabled={status === 'loading' || status === 'success'}
              variant={status === 'loading' || status === 'success' ? 'disabled' : 'secondary'}
              fullWidth
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Entrar con Passkey (QR o llave)
            </CARVIPIXButton>

            <CARVIPIXButton
              type="button"
              onClick={() => void handleEmailRecovery()}
              disabled={status === 'loading'}
              variant={status === 'loading' ? 'disabled' : 'secondary'}
              fullWidth
            >
              Recuperar acceso por correo
            </CARVIPIXButton>
          </form>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <p className="text-xs text-white/45 text-center">
              Acceso administrativo privado. Por seguridad, las credenciales nunca se muestran en pantalla.
            </p>
          </motion.div>
          </CARVIPIXCard>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-8">
          Acceso restringido solo para administradores. © CARVIPIX
        </p>
      </motion.div>
    </main>
  );
}
