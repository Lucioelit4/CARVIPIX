"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

export default function PrivateAccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/private-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Acceso no autorizado.");
        return;
      }
      window.location.replace("/");
    } catch {
      setError("No fue posible validar el acceso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#090b0f] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:42px_42px]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#101319] p-8 shadow-2xl shadow-black/50 sm:p-10">
        <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
          <p className="text-lg font-black tracking-[0.12em]">CARVIPIX</p>
          <span className="grid size-10 place-items-center border border-emerald-300/25 bg-emerald-300/5 text-emerald-300">
            <LockKeyhole size={18} aria-hidden="true" />
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Acceso privado</p>
        <h1 className="mt-4 text-3xl font-black tracking-normal">Plataforma restringida</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Ingresa la contraseña autorizada para continuar.</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-white/55" htmlFor="private-password">Contraseña</label>
          <input
            id="private-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full border border-white/15 bg-black/25 px-4 text-base text-white outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/10"
          />
          {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
          <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 bg-emerald-300 px-5 text-sm font-black text-[#07110d] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-60">
            {submitting ? "VALIDANDO" : "ENTRAR"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      </section>
    </main>
  );
}