'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, Download, Send, AlertCircle } from 'lucide-react';
import { CARVIPIXCard, CARVIPIXBadge, CARVIPIXButton } from '@/app/design-system';

type FounderBetaStatus = {
  isFounder: boolean;
  membershipPlan: string;
  membershipStatus: string;
  daysRemaining: number;
  expiresAt: string;
  codeUsed: string;
  licenseKey: string | null;
  telegramUrl: string | null;
  error?: string;
};

export default function FounderBetaPanel() {
  const [status, setStatus] = useState<FounderBetaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/client/beta/status', { cache: 'no-store' });
        const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: FounderBetaStatus };
        if (payload.ok && payload.data) {
          setStatus(payload.data);
        } else {
          setStatus({ isFounder: false, membershipPlan: '', membershipStatus: '', daysRemaining: 0, expiresAt: '', codeUsed: '', licenseKey: null, telegramUrl: null });
        }
      } catch {
        setStatus({ isFounder: false, membershipPlan: '', membershipStatus: '', daysRemaining: 0, expiresAt: '', codeUsed: '', licenseKey: null, telegramUrl: null });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <CARVIPIXCard variant="premium" padding="16" hover={false}>
        <p className="text-white/50 text-sm">Cargando estado de beta...</p>
      </CARVIPIXCard>
    );
  }

  if (!status?.isFounder) {
    return null;
  }

  const isExpiringSoon = status.daysRemaining <= 7;
  const isExpired = status.daysRemaining <= 0;

  return (
    <div className="space-y-4">
      <CARVIPIXCard variant="premium" padding="16" hover={false}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-bold">🎯 Programa Fundadores CARVIPIX</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Eres parte del grupo exclusivo de validadores beta de la plataforma.
            </p>

            {/* Estado de membresía */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Plan</p>
                <p className="font-semibold text-white">{status.membershipPlan}</p>
                <CARVIPIXBadge variant="success" className="mt-2 text-xs">FOUNDERS_BETA</CARVIPIXBadge>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Estado</p>
                <p className="font-semibold text-white capitalize">{status.membershipStatus}</p>
                {!isExpired && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                    <Clock className="w-3 h-3" /> {status.daysRemaining} días
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de expiración */}
            {isExpired && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-300">
                ⚠️ Tu acceso beta ha expirado. Contacta al equipo para extender.
              </div>
            )}
            {isExpiringSoon && !isExpired && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-300">
                ⏰ Tu acceso vence en {status.daysRemaining} días ({status.expiresAt})
              </div>
            )}

            {/* Información del código */}
            {status.codeUsed && (
              <div className="bg-white/5 rounded-lg p-3 mb-4 text-sm">
                <p className="text-white/50 mb-1">Código usado</p>
                <p className="font-mono text-[#D4AF37] font-semibold">{status.codeUsed}</p>
              </div>
            )}

            {/* Licencia del EA */}
            {status.licenseKey && (
              <div className="bg-white/5 rounded-lg p-3 mb-4 text-sm">
                <p className="text-white/50 mb-1">Licencia EA (Demo)</p>
                <p className="font-mono text-[#D4AF37] font-semibold text-xs">{status.licenseKey}</p>
                <p className="text-white/40 text-xs mt-1">✓ DEMO_ONLY — No se permite trading real</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-4xl">🎁</div>
        </div>
      </CARVIPIXCard>

      {/* Acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Descargar EA */}
        <Link href="/dashboard/descargas">
          <CARVIPIXButton
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            fullWidth
          >
            Descargar EA
          </CARVIPIXButton>
        </Link>

        {/* Telegram */}
        {status.telegramUrl && (
          <a href={status.telegramUrl} target="_blank" rel="noopener noreferrer">
            <CARVIPIXButton variant="secondary" leftIcon={<Send className="w-4 h-4" />} fullWidth>
              Grupo Telegram
            </CARVIPIXButton>
          </a>
        )}

        {/* Reportar problema */}
        <CARVIPIXButton
          variant="ghost"
          leftIcon={<AlertCircle className="w-4 h-4" />}
          fullWidth
        >
          Reportar Problema
        </CARVIPIXButton>
      </div>

      {/* Reglas beta */}
      <CARVIPIXCard variant="info" padding="12" hover={false}>
        <h4 className="font-semibold text-blue-300 mb-2 text-sm">📋 Reglas de la Beta Privada</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>✓ Solo MT5 DEMO — no se permite cuenta real</li>
          <li>✓ Acceso a grupo Telegram de prueba exclusivo</li>
          <li>✓ Soporte prioritario via reportes</li>
          <li>✓ Feedback directo al equipo de desarrollo</li>
          <li>✓ Acceso anticipado a nuevas funciones</li>
        </ul>
      </CARVIPIXCard>
    </div>
  );
}
