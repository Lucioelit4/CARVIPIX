"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from "@/app/design-system";

type StrategicPartnerRequest = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  companyOrBrand: string;
  platforms: string[];
  followersApprox: string;
  status: string;
  internalNotes: string | null;
  assignedAdmin: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "Nueva",
  in_review: "En revision",
  info_required: "Informacion requerida",
  approved_for_contact: "Aprobada para contacto",
  rejected: "Rechazada",
  archived: "Archivada",
};

function badgeVariantByStatus(status: string): "success" | "danger" | "warning" | "info" | "admin" {
  if (status === "approved_for_contact") return "success";
  if (status === "rejected") return "danger";
  if (status === "in_review" || status === "info_required") return "warning";
  if (status === "archived") return "admin";
  return "info";
}

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState<StrategicPartnerRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/commercial", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as {
      data?: { strategicPartnerRequests?: StrategicPartnerRequest[] };
    };
    setRequests(payload.data?.strategicPartnerRequests ?? []);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const updateStatus = async (requestId: string, status: string, adminNotes?: string) => {
    setBusyId(requestId);
    await fetch("/api/admin/commercial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStrategicPartnerRequest", requestId, status, adminNotes }),
    });
    setBusyId(null);
    await load();
  };

  const assignRequest = async (requestId: string) => {
    const notes = [
      requests.find((item) => item.id === requestId)?.internalNotes ?? "",
      "Solicitud tomada por administracion para revision.",
    ]
      .filter(Boolean)
      .join("\n\n");

    await updateStatus(requestId, "in_review", notes);
  };

  const saveInternalNote = async (requestId: string) => {
    const note = String(noteDraft[requestId] ?? "").trim();
    if (!note) {
      return;
    }

    const current = requests.find((item) => item.id === requestId);
    const merged = [current?.internalNotes ?? "", `[${new Date().toISOString()}] ${note}`]
      .filter(Boolean)
      .join("\n\n");

    await updateStatus(requestId, current?.status ?? "new", merged);
    setNoteDraft((prev) => ({ ...prev, [requestId]: "" }));
  };

  const orderedRequests = useMemo(
    () => [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Solicitudes de Socios Estrategicos</h2>
        <p className="text-white/60">Revision institucional, gestion de estado y notas internas administrativas.</p>
      </div>

      <div className="space-y-4">
        {orderedRequests.map((request) => {
          const expanded = expandedId === request.id;
          const statusLabel = STATUS_LABEL[request.status] ?? request.status;

          return (
            <CARVIPIXCard key={request.id} variant="admin" padding="16" hover={false}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono text-sm text-white/50">{request.id}</p>
                      <CARVIPIXBadge variant={badgeVariantByStatus(request.status)}>{statusLabel}</CARVIPIXBadge>
                    </div>
                    <p className="text-white font-medium">{request.fullName}</p>
                    <p className="text-sm text-white/60">{request.companyOrBrand} · {request.country}</p>
                    <p className="text-xs text-white/50 mt-1">{request.email} · {request.whatsapp}</p>
                    <p className="text-xs text-white/50 mt-1">Plataformas: {request.platforms.join(", ") || "N/D"} · Audiencia: {request.followersApprox || "N/D"}</p>
                    <p className="text-xs text-white/50 mt-1">Fecha: {new Date(request.createdAt).toLocaleString("es-ES")} · Asignado: {request.assignedAdmin || "Sin asignar"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CARVIPIXButton size="sm" variant="ghost" disabled={busyId === request.id} onClick={() => setExpandedId(expanded ? null : request.id)}>
                      Ver solicitud
                    </CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="secondary" disabled={busyId === request.id} onClick={() => void assignRequest(request.id)}>
                      Tomar solicitud
                    </CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="secondary" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, "in_review")}>Marcar en revision</CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="secondary" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, "info_required")}>Solicitar informacion</CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="premium" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, "approved_for_contact")}>Aprobar para contacto</CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="danger" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, "rejected")}>Rechazar</CARVIPIXButton>
                    <CARVIPIXButton size="sm" variant="ghost" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, "archived")}>Archivar</CARVIPIXButton>
                  </div>
                </div>

                {expanded ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">Notas internas</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{request.internalNotes || "Sin notas internas"}</p>
                    <textarea
                      value={noteDraft[request.id] ?? ""}
                      onChange={(event) => setNoteDraft((prev) => ({ ...prev, [request.id]: event.target.value }))}
                      placeholder="Agregar nota interna (solo visible para administradores)"
                      className="mt-3 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                    <div className="mt-3">
                      <CARVIPIXButton size="sm" variant="secondary" disabled={busyId === request.id} onClick={() => void saveInternalNote(request.id)}>
                        Guardar nota interna
                      </CARVIPIXButton>
                    </div>
                  </div>
                ) : null}
              </div>
            </CARVIPIXCard>
          );
        })}
      </div>
    </div>
  );
}
