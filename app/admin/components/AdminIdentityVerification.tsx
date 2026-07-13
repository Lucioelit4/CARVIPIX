"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Filter, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";

type IdentityStatus = "not_started" | "pending" | "approved" | "rejected" | "canceled";

type Requirement = {
  serviceKey: string;
  required: boolean;
  updatedBy: string | null;
  updatedAt: string;
};

type IdentityRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  status: IdentityStatus;
  observations: string;
  rejectionReason: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
  files: {
    front: { fileName: string } | null;
    back: { fileName: string } | null;
  };
};

type AdminPayload = {
  requests: IdentityRequest[];
  requirements: Requirement[];
  counts: Record<IdentityStatus, number>;
  accessLogs: Array<{ id: string; requestId: string; actorId: string; actorRole: string; action: string; createdAt: string }>;
};

function statusVariant(status: IdentityStatus): "success" | "warning" | "danger" | "default" {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  if (status === "canceled") return "danger";
  if (status === "rejected") return "danger";
  return "default";
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("es-ES");
}

export default function AdminIdentityVerification() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IdentityStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<IdentityRequest | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/identity-verification", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: AdminPayload; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "No se pudo cargar la verificacion de identidad");
      }
      setData(payload.data);
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

  const filteredRequests = useMemo(() => {
    return (data?.requests ?? []).filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = `${item.userName} ${item.userEmail} ${item.rejectionReason} ${item.observations}`.toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data?.requests, search, statusFilter]);

  const review = async (requestId: string, action: "approve" | "reject" | "request-new-document") => {
    setBusyId(requestId);
    setError(null);

    try {
      const response = await fetch("/api/admin/identity-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          observations: action === "approve" ? "Documento aprobado" : action === "request-new-document" ? "Solicitamos nuevo documento" : "Documento rechazado",
          rejectionReason: action === "reject" ? "No cumple requisitos" : action === "request-new-document" ? "Solicitamos nueva fotografía" : "",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo actualizar la solicitud");
      }

      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la solicitud");
    } finally {
      setBusyId(null);
    }
  };

  const toggleRequirement = async (serviceKey: string, required: boolean) => {
    if (!data) return;
    setBusyId(serviceKey);
    setError(null);

    try {
      const response = await fetch("/api/admin/identity-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-requirements",
          requirements: data.requirements.map((item) =>
            item.serviceKey === serviceKey ? { serviceKey: item.serviceKey, required } : { serviceKey: item.serviceKey, required: item.required }
          ),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "No se pudo actualizar el requisito");
      }

      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar el requisito");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <CARVIPIXCard variant="admin" padding="16" hover={false}><p className="text-white/70">Cargando verificación de identidad...</p></CARVIPIXCard>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#D4AF37]" /> Verificación de identidad</h3>
          <p className="text-sm text-white/60 mt-1">Usuarios, documentos seguros, auditoría y requisito por servicio.</p>
        </div>
        <CARVIPIXButton variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
          Refrescar
        </CARVIPIXButton>
      </div>

      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(["pending", "approved", "rejected", "canceled", "not_started"] as const).map((status) => (
          <CARVIPIXCard key={status} variant="statistics" padding="16" hover={false}>
            <p className="text-xs text-white/60">{status}</p>
            <p className="mt-2 text-2xl font-bold text-white">{data?.counts?.[status] ?? 0}</p>
          </CARVIPIXCard>
        ))}
      </div>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-lg font-bold">Requisitos por servicio</h4>
          <span className="text-xs text-white/50">Editables sin cambiar código</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data?.requirements.map((item) => (
            <div key={item.serviceKey} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-semibold text-white">{item.serviceKey}</p>
              <button
                type="button"
                disabled={busyId === item.serviceKey}
                onClick={() => void toggleRequirement(item.serviceKey, !item.required)}
                className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${item.required ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}
              >
                {item.required ? "Requisito activo" : "Requisito desactivado"}
              </button>
              <p className="mt-2 text-[11px] text-white/55">Actualizado: {formatDate(item.updatedAt)}</p>
            </div>
          ))}
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#D4AF37]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario, correo o motivo" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected", "canceled", "not_started"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1 text-xs ${statusFilter === status ? "border-[#D4AF37] text-[#D4AF37]" : "border-white/15 text-white/70"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <p className="text-sm text-white/60">Sin solicitudes con ese filtro.</p>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-white">{request.userName}</strong>
                      <CARVIPIXBadge variant={statusVariant(request.status)}>{request.status}</CARVIPIXBadge>
                    </div>
                    <p className="mt-1 text-sm text-white/70">{request.userEmail} · {request.userRole}</p>
                    <p className="mt-1 text-xs text-white/50">Enviado: {formatDate(request.submittedAt)} · Revisado: {formatDate(request.reviewedAt)}</p>
                    {request.observations ? <p className="mt-2 text-sm text-white/70">Observaciones: {request.observations}</p> : null}
                    {request.rejectionReason ? <p className="mt-1 text-sm text-[#D4AF37]">Motivo: {request.rejectionReason}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CARVIPIXButton variant="secondary" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setSelectedRequest(request)}>
                      Ver documentos
                    </CARVIPIXButton>
                    <CARVIPIXButton variant="premium" size="sm" disabled={busyId === request.id} onClick={() => void review(request.id, "approve")}>Aprobar</CARVIPIXButton>
                    <CARVIPIXButton variant="danger" size="sm" disabled={busyId === request.id} onClick={() => void review(request.id, "reject")}>Rechazar</CARVIPIXButton>
                    <CARVIPIXButton variant="ghost" size="sm" disabled={busyId === request.id} onClick={() => void review(request.id, "request-new-document")}>Solicitar nuevo documento</CARVIPIXButton>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-white/60 md:grid-cols-2">
                  <p>Frente: {request.files.front?.fileName ?? "No cargado"}</p>
                  <p>Reverso: {request.files.back?.fileName ?? "No cargado"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h4 className="text-lg font-bold mb-3">Auditoría de accesos</h4>
        <div className="max-h-80 space-y-2 overflow-auto">
          {(data?.accessLogs ?? []).slice(0, 30).map((log) => (
            <div key={log.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
              <p className="text-white">{log.action}</p>
              <p className="mt-1">Actor: {log.actorId} · {log.actorRole}</p>
              <p className="mt-1 text-white/50">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </div>
      </CARVIPIXCard>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-5xl rounded-3xl border border-white/15 bg-[#070B10] p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Vista segura de documentos</h4>
              <button type="button" onClick={() => setSelectedRequest(null)} className="rounded-full border border-white/15 p-2 text-white/70"><XCircle className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {(["front", "back"] as const).map((side) => (
                <div key={side} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[#D4AF37]">{side}</p>
                  <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden rounded-xl bg-black/30">
                    <Image
                      src={`/api/admin/identity-verification/${encodeURIComponent(selectedRequest.id)}/document?side=${side}`}
                      alt={`${side} documento`}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
