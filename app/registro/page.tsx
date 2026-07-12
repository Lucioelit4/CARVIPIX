'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pais, setPais] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          correo,
          telefono,
          pais,
          password,
          confirmPassword,
          aceptaTerminos,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: Record<string, string>;
        warning?: string;
      };

      if (!response.ok) {
        const firstValidationError = data.errors ? Object.values(data.errors)[0] : '';
        setError(firstValidationError || data.error || 'No se pudo completar el registro.');
        return;
      }

      setMessage(data.warning || 'Registro completado correctamente. Revisa tu correo para verificar tu cuenta y continuar.');
      setNombre('');
      setApellido('');
      setCorreo('');
      setTelefono('');
      setPais('');
      setPassword('');
      setConfirmPassword('');
      setAceptaTerminos(false);
    } catch {
      setError('No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-3xl font-bold">Crear cuenta</h1>
        <p className="mb-8 text-center text-sm text-white/70">Registro de usuario CARVIPIX</p>
        <CARVIPIXCard variant="default" padding="24" hover={false}>
          <form className="space-y-3" onSubmit={onSubmit}>
            <input className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <input className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
            <input type="email" className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            <input className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            <input className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="País" value={pais} onChange={(e) => setPais(e.target.value)} required />
            <input type="password" className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Contraseña (mínimo 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <input type="password" className="w-full rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-sm" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            <label className="flex items-center gap-2 text-xs text-white/80">
              <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} required />
              Acepto términos y condiciones
            </label>
            {message ? <p className="text-xs text-emerald-400">{message}</p> : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <CARVIPIXButton type="submit" variant="premium" fullWidth>{loading ? 'Registrando...' : 'Crear cuenta'}</CARVIPIXButton>
          </form>
          <p className="mt-4 text-xs text-white/70">¿Ya tienes cuenta? <Link href="/login" className="text-[#D4AF37]">Inicia sesión</Link></p>
        </CARVIPIXCard>
      </div>
    </main>
  );
}
