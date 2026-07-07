"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";

type FormState = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  pais: string;
  password: string;
  confirmPassword: string;
  aceptaTerminos: boolean;
};

type ApiResult = {
  ok: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
};

const INITIAL_STATE: FormState = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  pais: "",
  password: "",
  confirmPassword: "",
  aceptaTerminos: false,
};

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  return /^[0-9\s\-+()]{8,}$/.test(value.replace(/\s/g, ""));
}

function isStrongPassword(value: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
}

export default function CrearCuentaPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string>("");
  const [created, setCreated] = useState(false);

  const canSubmit = useMemo(() => {
    return !submitting;
  }, [submitting]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (form.nombre.trim().length < 2) nextErrors.nombre = "El nombre debe tener al menos 2 caracteres.";
    if (form.apellido.trim().length < 2) nextErrors.apellido = "El apellido debe tener al menos 2 caracteres.";
    if (!isEmail(form.correo.trim())) nextErrors.correo = "Ingresa un correo válido.";
    if (!isPhone(form.telefono.trim())) nextErrors.telefono = "Ingresa un teléfono válido.";
    if (form.pais.trim().length < 2) nextErrors.pais = "Selecciona un país válido.";
    if (!isStrongPassword(form.password)) {
      nextErrors.password = "La contraseña debe tener mínimo 8 caracteres, letras y números.";
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!form.aceptaTerminos) nextErrors.aceptaTerminos = "Debes aceptar términos y condiciones.";

    return nextErrors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerMessage("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => ({}))) as ApiResult;

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setServerMessage(result.error ?? "No se pudo crear la cuenta.");
        return;
      }

      setCreated(true);
      setForm(INITIAL_STATE);
      setErrors({});
      setServerMessage(result.message ?? "Cuenta creada correctamente.");
    } catch {
      setServerMessage("Error de conexión. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8">
      <CARVIPIXCard variant="admin" padding="24" hover={false}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-2 text-white/60">Completa tus datos para registrar una nueva cuenta.</p>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <label className="space-y-2">
            <span className="text-sm text-white/80">Nombre</span>
            <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} />
            {errors.nombre ? <p className="text-xs text-red-400">{errors.nombre}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Apellido</span>
            <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.apellido} onChange={(e) => handleChange("apellido", e.target.value)} />
            {errors.apellido ? <p className="text-xs text-red-400">{errors.apellido}</p> : null}
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-white/80">Correo</span>
            <input type="email" className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.correo} onChange={(e) => handleChange("correo", e.target.value)} />
            {errors.correo ? <p className="text-xs text-red-400">{errors.correo}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Teléfono</span>
            <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.telefono} onChange={(e) => handleChange("telefono", e.target.value)} />
            {errors.telefono ? <p className="text-xs text-red-400">{errors.telefono}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">País</span>
            <input className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.pais} onChange={(e) => handleChange("pais", e.target.value)} />
            {errors.pais ? <p className="text-xs text-red-400">{errors.pais}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Contraseña</span>
            <input type="password" className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
            {errors.password ? <p className="text-xs text-red-400">{errors.password}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Confirmar contraseña</span>
            <input type="password" className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#D4AF37]" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} />
            {errors.confirmPassword ? <p className="text-xs text-red-400">{errors.confirmPassword}</p> : null}
          </label>

          <label className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={form.aceptaTerminos} onChange={(e) => handleChange("aceptaTerminos", e.target.checked)} />
            <span className="text-sm text-white/80">
              Acepto los <Link href="/terms" className="text-[#D4AF37] underline">términos y condiciones</Link>.
            </span>
          </label>
          {errors.aceptaTerminos ? <p className="sm:col-span-2 text-xs text-red-400">{errors.aceptaTerminos}</p> : null}

          {serverMessage ? (
            <p className={`sm:col-span-2 text-sm ${created ? "text-green-400" : "text-red-400"}`}>{serverMessage}</p>
          ) : null}

          <div className="sm:col-span-2 flex items-center gap-3 pt-2">
            <CARVIPIXButton type="submit" disabled={!canSubmit} variant="premium">
              {submitting ? "Creando cuenta..." : "Crear cuenta"}
            </CARVIPIXButton>
            <Link href="/login" className="text-sm text-white/70 underline">Ya tengo cuenta</Link>
          </div>
        </form>
      </CARVIPIXCard>
    </main>
  );
}
