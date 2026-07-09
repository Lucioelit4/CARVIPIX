'use client';

import { useEffect, useState } from 'react';

import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type CapitalRequest = {
  id: string;
  userId: string;
  targetCapital: number;
  status: string;
  riskProfile: string;
  notes: string | null;
  contractSigned: boolean;
  adminNotes: string | null;
  createdAt: string;
};

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState<CapitalRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch('/api/admin/commercial', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as { data?: { capitalRequests?: CapitalRequest[] } };
    setRequests(payload.data?.capitalRequests ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (requestId: string, status: string) => {
    setBusyId(requestId);
    await fetch('/api/admin/commercial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateCapitalRequest', requestId, status }),
    });
    setBusyId(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Solicitudes de Capital</h2>
        <p className="text-white/60">Flujo comercial real de solicitud, aceptación y contrato.</p>
      </div>
      <div className="space-y-4">
        {requests.map((request) => (
          <CARVIPIXCard key={request.id} variant="admin" padding="16" hover={false}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-mono text-sm text-white/50">{request.id}</p>
                  <CARVIPIXBadge variant={request.status === 'accepted' || request.status === 'active' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</CARVIPIXBadge>
                </div>
                <p className="text-white font-medium">Usuario {request.userId}</p>
                <p className="text-sm text-white/60">Objetivo: ${request.targetCapital.toLocaleString()} · Riesgo {request.riskProfile}</p>
                <p className="text-xs text-white/50 mt-1">Contrato firmado: {request.contractSigned ? 'Sí' : 'No'} · {new Date(request.createdAt).toLocaleString('es-ES')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CARVIPIXButton size="sm" variant="ghost" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, 'accepted')}>Aceptar</CARVIPIXButton>
                <CARVIPIXButton size="sm" variant="secondary" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, 'contract_sent')}>Contrato</CARVIPIXButton>
                <CARVIPIXButton size="sm" variant="danger" disabled={busyId === request.id} onClick={() => void updateStatus(request.id, 'rejected')}>Rechazar</CARVIPIXButton>
              </div>
            </div>
          </CARVIPIXCard>
        ))}
      </div>
    </div>
  );
}
