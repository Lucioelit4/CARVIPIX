"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";

import { CARVIPIXButton } from "@/app/design-system";

type FounderStatus = {
  active?: boolean;
  status?: string | null;
  licenseStatus?: string | null;
};

export default function FounderActivationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<FounderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/founder-access/status", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login?next=%2Ffundador%2Factivar");
          return null;
        }
        return response.ok ? (response.json() as Promise<FounderStatus>) : null;
      })
      .then((result) => setStatus(result))
      .finally(() => setLoading(false));
  }, [router]);

  const activate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/founder-access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "No se pudo activar el acceso");
        return;
      }
      setCode("");
      setStatus({ active: true, status: "ACTIVE", licenseStatus: "ACTIVE" });
      setMessage("Acceso Founder activado");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] px-4 py-24 text-white">
      <section className="mx-auto w-full max-w-xl border border-white/10 bg-[#0B0B0B] p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <span className="flex h-11 w-11 items-center justify-center bg-[#D4AF37]/10 text-[#D4AF37]">
            <ShieldCheck aria-hidden="true" size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Acceso Founder</h1>
            <p className="mt-1 text-sm text-white/55">Activación privada de cuenta</p>
          </div>
        </div>

        {loading ? <p className="py-10 text-sm text-white/55">Consultando acceso...</p> : null}

        {!loading && status?.active ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto text-emerald-400" size={42} />
            <p className="mt-4 text-lg font-semibold">Founder activo</p>
            <p className="mt-2 text-sm text-white/55">Licencia Bot: {status.licenseStatus ?? "ACTIVE"}</p>
            <CARVIPIXButton className="mt-6" onClick={() => router.push("/dashboard")}>Ir al Dashboard</CARVIPIXButton>
          </div>
        ) : null}

        {!loading && !status?.active ? (
          <form className="space-y-5 pt-7" onSubmit={activate}>
            <label className="block text-sm font-medium" htmlFor="founder-code">Código Founder</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                id="founder-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
                placeholder="CVX-FND-XXXX-XXXX-XXXX"
                className="h-12 w-full border border-white/15 bg-black pl-11 pr-3 font-mono text-sm outline-none transition focus:border-[#D4AF37]"
                required
              />
            </div>
            {message ? <p role="status" className="text-sm text-[#F4C542]">{message}</p> : null}
            <CARVIPIXButton type="submit" className="w-full" isLoading={submitting}>Activar acceso</CARVIPIXButton>
          </form>
        ) : null}
      </section>
    </main>
  );
}