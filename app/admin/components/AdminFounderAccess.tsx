"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";

import { CARVIPIXButton } from "@/app/design-system";

type FounderCode = {
  id: string;
  status: "AVAILABLE" | "REDEEMED" | "REVOKED";
  assigned_email: string;
  redeemed_by_user_id: string | null;
  redeemed_at: string | null;
  replacement_count: number;
};

type FounderProfile = {
  userId: string;
  codeId: string;
  status: "ACTIVE" | "REVOKED" | "BLOCKED";
  activatedAt: string;
  entitlements: string[];
  licenseStatus: string | null;
};

type FounderData = {
  codes: FounderCode[];
  profiles: FounderProfile[];
  audit: Array<{ id: string; action: string; result: string; user_id?: string; created_at: string }>;
};

type OneTimeCode = { codeId: string; assignedEmail: string; code: string };

export default function AdminFounderAccess() {
  const [data, setData] = useState<FounderData | null>(null);
  const [emails, setEmails] = useState(["", "", ""]);
  const [oneTimeCodes, setOneTimeCodes] = useState<OneTimeCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/founder-access", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: FounderData };
    if (payload.ok && payload.data) setData(payload.data);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/founder-access", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<{ ok?: boolean; data?: FounderData }>)
      .then((payload) => {
        if (active && payload.ok && payload.data) setData(payload.data);
      });
    return () => { active = false; };
  }, []);

  const runAction = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/founder-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        codes?: OneTimeCode[];
        replacement?: OneTimeCode;
      };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error ?? "No se pudo completar la operación");
        return;
      }
      if (payload.codes?.length) setOneTimeCodes(payload.codes);
      if (payload.replacement) setOneTimeCodes([payload.replacement]);
      setMessage("Operación completada");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-white">Founder All Access</h2>
        <p className="mt-1 text-sm text-white/55">Tres accesos permanentes, gratuitos y separados del sistema comercial.</p>
      </header>

      {data && data.codes.length === 0 ? (
        <section className="border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Crear los tres códigos</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {emails.map((email, index) => (
              <input
                key={index}
                type="email"
                value={email}
                onChange={(event) => setEmails((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                placeholder={`Correo del fundador ${index + 1}`}
                className="h-11 border border-white/15 bg-black px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            ))}
          </div>
          <CARVIPIXButton className="mt-4" isLoading={busy} onClick={() => void runAction({ action: "initialize", emails })}>
            Generar exactamente 3
          </CARVIPIXButton>
        </section>
      ) : null}

      {oneTimeCodes.length > 0 ? (
        <section className="border border-amber-400/40 bg-amber-400/5 p-5">
          <h3 className="font-semibold text-amber-300">Visualización única</h3>
          <p className="mt-1 text-xs text-white/55">Al salir de esta vista los valores completos no podrán recuperarse.</p>
          <div className="mt-4 space-y-3">
            {oneTimeCodes.map((item) => (
              <div key={item.codeId} className="flex flex-col gap-2 border border-white/10 bg-black p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-white/50">{item.assignedEmail}</p>
                  <code className="mt-1 block text-sm text-[#F4C542]">{item.code}</code>
                </div>
                <button
                  type="button"
                  aria-label="Copiar código"
                  title="Copiar código"
                  className="flex h-10 w-10 items-center justify-center border border-white/15 text-white hover:border-[#D4AF37]"
                  onClick={() => void navigator.clipboard.writeText(item.code)}
                >
                  <Copy size={17} />
                </button>
              </div>
            ))}
          </div>
          <CARVIPIXButton variant="secondary" className="mt-4" onClick={() => setOneTimeCodes([])}>Ocultar definitivamente</CARVIPIXButton>
        </section>
      ) : null}

      <section className="overflow-x-auto border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr><th className="p-3">Slot</th><th className="p-3">Asignado</th><th className="p-3">Estado</th><th className="p-3">Cuenta</th><th className="p-3">Acciones</th></tr>
          </thead>
          <tbody>
            {(data?.codes ?? []).map((code, index) => {
              const profile = data?.profiles.find((item) => item.codeId === code.id);
              return (
                <tr key={code.id} className="border-t border-white/10">
                  <td className="p-3 font-mono text-white/70">FND-{index + 1}</td>
                  <td className="p-3 text-white">{code.assigned_email}</td>
                  <td className="p-3 text-[#F4C542]">{code.status}</td>
                  <td className="p-3 text-white/60">{code.redeemed_by_user_id ?? "Sin vincular"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {profile?.status === "ACTIVE" ? (
                        <>
                          <button type="button" title="Revocar" aria-label="Revocar" className="flex h-9 w-9 items-center justify-center border border-white/15" disabled={busy} onClick={() => void runAction({ action: "revoke", userId: profile.userId })}><ShieldOff size={16} /></button>
                          <button type="button" title="Bloquear" aria-label="Bloquear" className="flex h-9 w-9 items-center justify-center border border-white/15" disabled={busy} onClick={() => void runAction({ action: "block", userId: profile.userId })}><Ban size={16} /></button>
                        </>
                      ) : null}
                      {code.status === "REVOKED" ? (
                        <button type="button" title="Reemplazar" aria-label="Reemplazar" className="flex h-9 w-9 items-center justify-center border border-white/15" disabled={busy} onClick={() => void runAction({ action: "replace", codeId: code.id, assignedEmail: code.assigned_email })}><RefreshCw size={16} /></button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {message ? <p role="status" className="text-sm text-[#F4C542]">{message}</p> : null}

      <section>
        <h3 className="flex items-center gap-2 font-semibold"><KeyRound size={17} /> Auditoría reciente</h3>
        <div className="mt-3 divide-y divide-white/10 border border-white/10">
          {(data?.audit ?? []).slice(0, 20).map((event) => (
            <div key={event.id} className="flex flex-wrap justify-between gap-2 p-3 text-xs">
              <span className="text-white">{event.action}</span>
              <span className="text-white/50">{event.result} · {new Date(event.created_at).toLocaleString("es-MX")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
