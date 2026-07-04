'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, Check } from 'lucide-react';
import { logAccessEvent, writeAuthSession } from '@/app/lib/auth/session';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_CODE = 'CARVIPIX-ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (code.toUpperCase() === ADMIN_CODE) {
        writeAuthSession('admin');
        logAccessEvent('admin_login', 'Inicio de sesión administrativo exitoso.');
        onLogin();
      } else {
        setError('Código de acceso incorrecto. Intenta de nuevo.');
        setCode('');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[#05070B] text-white flex items-center justify-center p-4">
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
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B111A] to-[#05070B] p-8 shadow-2xl shadow-[#D4AF37]/10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Código de acceso
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingresa el código"
                className={`w-full px-4 py-3 rounded-lg border-2 transition ${
                  error
                    ? 'border-red-500/50 bg-red-500/10 text-white focus:border-red-400'
                    : 'border-white/10 bg-white/5 text-white focus:border-[#D4AF37]'
                } outline-none font-mono text-center text-lg tracking-widest`}
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                loading || !code.trim()
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-[#D4AF37] text-black hover:bg-[#f5d76e] shadow-lg shadow-[#D4AF37]/30'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                'Acceder al Panel'
              )}
            </button>
          </form>

          {/* Demo Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <p className="text-xs text-white/50 text-center mb-3">Código de acceso demo:</p>
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <p className="font-mono text-sm text-[#D4AF37]">CARVIPIX-ADMIN</p>
            </div>
            <p className="text-xs text-white/40 text-center mt-3">
              Panel administrativo privado. Datos de demostración.
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-8">
          Acceso restringido solo para administradores. © CARVIPIX
        </p>
      </motion.div>
    </main>
  );
}
