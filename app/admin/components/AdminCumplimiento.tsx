'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileCheck, Film, History, Save, ShieldAlert } from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type LegalDocument = {
  slug: string;
  title: string;
  route: string;
  version: string;
  updatedAt: string;
  author: string;
  status: 'Activo' | 'Borrador' | 'Obsoleto';
  relatedModules: string[];
  requiredBeforePayment: boolean;
};

type ComplianceVideo = {
  id: string;
  scope: 'public-home' | 'member-dashboard';
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  active: boolean;
  updatedAt: string;
};

type AdminAuditLog = {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type CompliancePayload = {
  legalDocuments: LegalDocument[];
  latestActiveLegalDocuments: LegalDocument[];
  videos: ComplianceVideo[];
  auditLogs: AdminAuditLog[];
  domains: string[];
};

export default function AdminCumplimiento() {
  const [data, setData] = useState<CompliancePayload | null>(null);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [videos, setVideos] = useState<ComplianceVideo[]>([]);
  const [busy, setBusy] = useState<'legal' | 'videos' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);

    try {
      const response = await fetch('/api/admin/compliance', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CompliancePayload; error?: string };

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo cargar el modulo de cumplimiento');
      }

      setData(payload.data);
      setLegalDocuments(payload.data.legalDocuments);
      setVideos(payload.data.videos);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el modulo de cumplimiento');
    }
  };

  useEffect(() => {
    const task = Promise.resolve().then(() => load());
    void task;
  }, []);

  const activeRequiredCount = useMemo(
    () => legalDocuments.filter((doc) => doc.status === 'Activo' && doc.requiredBeforePayment).length,
    [legalDocuments]
  );

  const saveLegalDocuments = async () => {
    setBusy('legal');
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-legal-documents', legalDocuments }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CompliancePayload; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo guardar documentos legales');
      }

      setData(payload.data);
      setLegalDocuments(payload.data.legalDocuments);
      setVideos(payload.data.videos);
      setMessage('Documentos legales versionados actualizados.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar documentos legales');
    } finally {
      setBusy(null);
    }
  };

  const saveVideos = async () => {
    setBusy('videos');
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-videos', videos }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; data?: CompliancePayload; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || 'No se pudo guardar videos');
      }

      setData(payload.data);
      setLegalDocuments(payload.data.legalDocuments);
      setVideos(payload.data.videos);
      setMessage('Videos multimedia actualizados.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar videos');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cumplimiento, Legal y Multimedia</h2>
        <p className="text-white/60">Gestion de videos, stack legal versionado, aceptacion previa a pago y auditoria de cambios administrativos.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      )}

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#D4AF37]" />
              Dominios de administracion ampliados
            </h3>
            <p className="text-sm text-white/60 mt-1">Cobertura operativa definida para ETAPA 3.</p>
          </div>
          <CARVIPIXBadge variant="warning">{activeRequiredCount} docs obligatorios para checkout</CARVIPIXBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data?.domains?.map((domain) => (
            <div key={domain} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              {domain}
            </div>
          ))}
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[#D4AF37]" />
            Documentos legales versionados
          </h3>
          <CARVIPIXButton variant="secondary" size="sm" leftIcon={<Save className="h-4 w-4" />} isLoading={busy === 'legal'} onClick={() => void saveLegalDocuments()}>
            Guardar legales
          </CARVIPIXButton>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Slug</th>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Titulo</th>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Ruta</th>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Version</th>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Estado</th>
                <th className="px-3 py-2 text-left text-xs text-white/60 uppercase">Pago</th>
              </tr>
            </thead>
            <tbody>
              {legalDocuments.map((doc, index) => (
                <tr key={`${doc.slug}-${doc.version}-${index}`} className="border-b border-white/5">
                  <td className="px-3 py-2 text-sm text-white/70">{doc.slug}</td>
                  <td className="px-3 py-2">
                    <input
                      value={doc.title}
                      onChange={(event) => setLegalDocuments((current) => current.map((item, idx) => idx === index ? { ...item, title: event.target.value } : item))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={doc.route}
                      onChange={(event) => setLegalDocuments((current) => current.map((item, idx) => idx === index ? { ...item, route: event.target.value } : item))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={doc.version}
                      onChange={(event) => setLegalDocuments((current) => current.map((item, idx) => idx === index ? { ...item, version: event.target.value } : item))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={doc.status}
                      onChange={(event) => setLegalDocuments((current) => current.map((item, idx) => idx === index ? { ...item, status: event.target.value as LegalDocument['status'] } : item))}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Borrador">Borrador</option>
                      <option value="Obsoleto">Obsoleto</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={doc.requiredBeforePayment}
                        onChange={(event) => setLegalDocuments((current) => current.map((item, idx) => idx === index ? { ...item, requiredBeforePayment: event.target.checked } : item))}
                      />
                      Requerido
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Film className="h-5 w-5 text-[#D4AF37]" />
            Videos multimedia
          </h3>
          <CARVIPIXButton variant="secondary" size="sm" leftIcon={<Save className="h-4 w-4" />} isLoading={busy === 'videos'} onClick={() => void saveVideos()}>
            Guardar videos
          </CARVIPIXButton>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {videos.map((video, index) => (
            <div key={video.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-sm text-white/70">{video.scope}</p>
              <input
                value={video.title}
                onChange={(event) => setVideos((current) => current.map((item, idx) => idx === index ? { ...item, title: event.target.value } : item))}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm"
              />
              <textarea
                value={video.description}
                onChange={(event) => setVideos((current) => current.map((item, idx) => idx === index ? { ...item, description: event.target.value } : item))}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm min-h-20"
              />
              <input
                value={video.videoUrl}
                onChange={(event) => setVideos((current) => current.map((item, idx) => idx === index ? { ...item, videoUrl: event.target.value } : item))}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs"
              />
              <input
                value={video.posterUrl}
                onChange={(event) => setVideos((current) => current.map((item, idx) => idx === index ? { ...item, posterUrl: event.target.value } : item))}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={video.active}
                  onChange={(event) => setVideos((current) => current.map((item, idx) => idx === index ? { ...item, active: event.target.checked } : item))}
                />
                Activo
              </label>
            </div>
          ))}
        </div>
      </CARVIPIXCard>

      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-white/10 pb-4">
          <History className="h-5 w-5 text-[#D4AF37]" />
          Auditoria de cumplimiento
        </h3>
        <div className="mt-4 space-y-2">
          {data?.auditLogs?.length ? (
            data.auditLogs.slice(0, 25).map((log) => (
              <div key={log.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                <p className="text-white">{log.action} · {log.resource}</p>
                <p className="mt-1">Actor: {log.actorId} · {new Date(log.createdAt).toLocaleString('es-ES')}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">Sin eventos de auditoria por ahora.</p>
          )}
        </div>
      </CARVIPIXCard>
    </div>
  );
}
