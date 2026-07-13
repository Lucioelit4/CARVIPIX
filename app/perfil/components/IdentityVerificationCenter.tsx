"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock3, UploadCloud, RefreshCw, ShieldAlert } from "lucide-react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";

type IdentityVerificationStatus = "not_started" | "pending" | "approved" | "rejected" | "canceled";

type Requirement = {
  serviceKey: string;
  required: boolean;
  updatedAt: string;
};

type IdentityVerificationState = {
  request?: {
    id: string;
    status: IdentityVerificationStatus;
    observations: string;
    rejectionReason: string;
    files?: {
      front?: { fileName: string; mimeType: string } | null;
      back?: { fileName: string; mimeType: string } | null;
    };
  } | null;
  status: IdentityVerificationStatus;
  statusLabel: string;
  requirements: Requirement[];
};

function statusVariant(status: IdentityVerificationStatus): "success" | "warning" | "danger" | "default" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "canceled") return "danger";
  if (status === "rejected") return "danger";
  return "default";
}

function statusIcon(status: IdentityVerificationStatus) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "pending") return <Clock3 className="h-4 w-4" />;
  return <ShieldAlert className="h-4 w-4" />;
}

export default function IdentityVerificationCenter() {
  const [state, setState] = useState<IdentityVerificationState | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [declarationAuthorizedUse, setDeclarationAuthorizedUse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLocked = state?.status === "approved";

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/client/identity-verification", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: IdentityVerificationState; error?: string };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "No se pudo cargar la verificacion de identidad");
      }

      setState(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la verificacion de identidad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = Promise.resolve().then(() => load());
    void task;
  }, []);

  const requirementLabels = useMemo(
    () =>
      state?.requirements ?? [
        { serviceKey: "capital-management", required: true, updatedAt: new Date().toISOString() },
        { serviceKey: "funding-program", required: true, updatedAt: new Date().toISOString() },
      ],
    [state?.requirements]
  );

  const onFileChange = (file: File | null, side: "front" | "back") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (side === "front") {
        setFrontPreview(String(reader.result ?? ""));
        setFrontFile(file);
      } else {
        setBackPreview(String(reader.result ?? ""));
        setBackFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!frontFile || !backFile) {
      setError("Debes subir frente y reverso del documento.");
      return;
    }

    if (!declarationAccepted || !declarationAuthorizedUse) {
      setError("Debes aceptar las dos declaraciones para continuar.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("frontDocument", frontFile);
      formData.set("backDocument", backFile);
      formData.set("declarationAccepted", String(declarationAccepted));
      formData.set("declarationAuthorizedUse", String(declarationAuthorizedUse));

      const response = await fetch("/api/client/identity-verification", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo enviar la verificacion");
      }

      setMessage("Solicitud enviada correctamente. Revisaremos tus documentos.");
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview(null);
      setBackPreview(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar la verificacion");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <p className="text-white/70">Cargando verificacion de identidad...</p>
      </CARVIPIXCard>
    );
  }

  return (
    <CARVIPIXCard variant="admin" padding="16" hover={false}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Verificacion de Identidad</p>
          <h3 className="mt-2 text-2xl font-bold">Centro de verificacion</h3>
          <p className="mt-1 text-sm text-white/60">Se integra con tu perfil y con los servicios que la requieren.</p>
        </div>
        <div className="flex items-center gap-2">
          <CARVIPIXBadge variant={statusVariant(state?.status ?? "not_started")}>{state?.statusLabel ?? "No iniciado"}</CARVIPIXBadge>
          <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
            Refrescar
          </CARVIPIXButton>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {requirementLabels.map((item) => (
          <div key={item.serviceKey} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            <p className="text-white/60 uppercase tracking-[0.08em] text-[10px]">Servicio</p>
            <p className="mt-1 font-semibold text-white">{item.serviceKey}</p>
            <p className="mt-1 text-xs text-white/65">Requiere verificacion: {item.required ? "Si" : "No"}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-2 text-white/85">
          {statusIcon(state?.status ?? "not_started")}
          <strong>Estado actual: {state?.statusLabel ?? "No iniciado"}</strong>
        </div>
        {state?.request?.observations ? <p className="mt-3 text-sm text-white/70">Observaciones: {state.request.observations}</p> : null}
        {state?.request?.rejectionReason ? <p className="mt-1 text-sm text-[#D4AF37]">Motivo: {state.request.rejectionReason}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-white/70">Frente de identificación oficial</span>
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isLocked}
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null, "front")}
              className="w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:text-black file:font-semibold disabled:opacity-60"
            />
            {frontPreview ? (
              <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/30">
                <Image src={frontPreview} alt="Vista previa frente" fill unoptimized className="object-contain" />
              </div>
            ) : null}
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">Reverso de identificación oficial</span>
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isLocked}
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null, "back")}
              className="w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:text-black file:font-semibold disabled:opacity-60"
            />
            {backPreview ? (
              <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/30">
                <Image src={backPreview} alt="Vista previa reverso" fill unoptimized className="object-contain" />
              </div>
            ) : null}
          </div>
        </label>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="flex items-start gap-3 text-sm text-white/75">
          <input type="checkbox" checked={declarationAccepted} disabled={isLocked} onChange={(event) => setDeclarationAccepted(event.target.checked)} className="mt-1" />
          <span>Declaro que este documento pertenece a mi persona.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-white/75">
          <input type="checkbox" checked={declarationAuthorizedUse} disabled={isLocked} onChange={(event) => setDeclarationAuthorizedUse(event.target.checked)} className="mt-1" />
          <span>Autorizo su uso únicamente para procesos de verificación relacionados con los servicios que lo requieran.</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <CARVIPIXButton
          variant="premium"
          disabled={busy || isLocked}
          leftIcon={<UploadCloud className="h-4 w-4" />}
          onClick={() => void submit()}
        >
          {busy ? "Enviando..." : isLocked ? "Verificación aprobada" : "Enviar verificación"}
        </CARVIPIXButton>
        {isLocked ? <span className="text-sm text-white/55">No puedes reemplazar documentos mientras el estado esté aprobado.</span> : null}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
        <p className="font-semibold text-white">Documentos cargados</p>
        <p className="mt-1">Frente: {state?.request?.files?.front?.fileName ?? "Aún no cargado"}</p>
        <p className="mt-1">Reverso: {state?.request?.files?.back?.fileName ?? "Aún no cargado"}</p>
      </div>
    </CARVIPIXCard>
  );
}
