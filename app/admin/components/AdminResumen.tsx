'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, DollarSign, Users } from 'lucide-react';

import { CARVIPIXCard } from '@/app/design-system';

type Overview = {
  users: number;
  activeMemberships: number;
  pendingCapitalRequests: number;
  openTickets: number;
  blockedAttempts: number;
};

export default function AdminResumen() {
  const [overview, setOverview] = useState<Overview>({ users: 0, activeMemberships: 0, pendingCapitalRequests: 0, openTickets: 0, blockedAttempts: 0 });

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/admin/commercial', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as { data?: { overview?: Overview } };
      if (payload.data?.overview) {
        setOverview(payload.data.overview);
      }
    };

    void load();
  }, []);

  const cards = [
    { icon: Users, label: 'Usuarios', value: overview.users, color: 'text-blue-400' },
    { icon: CheckCircle, label: 'Membresías activas', value: overview.activeMemberships, color: 'text-green-400' },
    { icon: Clock, label: 'Solicitudes de capital', value: overview.pendingCapitalRequests, color: 'text-yellow-400' },
    { icon: DollarSign, label: 'Tickets abiertos', value: overview.openTickets, color: 'text-[#D4AF37]' },
    { icon: AlertCircle, label: 'Bloqueos auditados', value: overview.blockedAttempts, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen Comercial</h2>
        <p className="text-white/60">Vista consolidada del producto comercial activo.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <CARVIPIXCard key={card.label} variant="admin" padding="16" hover={false}>
              <div className={`mb-3 ${card.color}`}><Icon className="w-5 h-5" /></div>
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
            </CARVIPIXCard>
          );
        })}
      </div>
    </div>
  );
}
