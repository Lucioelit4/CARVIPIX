'use client';

import { useEffect, useMemo, useState } from 'react';

import DetailModal from './DetailModal';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type UserRow = {
  id: string;
  email: string;
  name: string;
  officialPlan: string;
  status: string;
  membershipStatus: string;
  verified: boolean;
  registeredAt: string | null;
};

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/admin/commercial', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as { data?: { users?: UserRow[] } };
      setUsers(payload.data?.users ?? []);
    };

    void load();
  }, []);

  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.officialPlan}`.toLowerCase().includes(search.toLowerCase())), [search, users]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Usuarios</h2>
        <p className="text-white/60">Base real de clientes y estado comercial.</p>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuarios" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3" />
      <CARVIPIXCard variant="admin" padding="16" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-white/60">Usuario</th>
                <th className="px-4 py-3 text-left text-xs text-white/60">Plan</th>
                <th className="px-4 py-3 text-left text-xs text-white/60">Estado</th>
                <th className="px-4 py-3 text-left text-xs text-white/60">Verificado</th>
                <th className="px-4 py-3 text-right text-xs text-white/60">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs text-white/50">{user.email}</p>
                  </td>
                  <td className="px-4 py-4"><CARVIPIXBadge variant={user.officialPlan.includes('advanced') || user.officialPlan.includes('premium') ? 'premium' : 'default'}>{user.officialPlan.toUpperCase()}</CARVIPIXBadge></td>
                  <td className="px-4 py-4"><CARVIPIXBadge variant={user.membershipStatus === 'activo' ? 'success' : 'warning'}>{user.membershipStatus}</CARVIPIXBadge></td>
                  <td className="px-4 py-4 text-sm text-white/70">{user.verified ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-4 text-right"><CARVIPIXButton size="sm" variant="ghost" onClick={() => setSelectedUser(user)}>Ver</CARVIPIXButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CARVIPIXCard>
      <DetailModal isOpen={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} title="Usuario comercial">
        {selectedUser && (
          <div className="space-y-3 text-sm text-white/70">
            <p><span className="text-white">ID:</span> {selectedUser.id}</p>
            <p><span className="text-white">Email:</span> {selectedUser.email}</p>
            <p><span className="text-white">Plan:</span> {selectedUser.officialPlan}</p>
            <p><span className="text-white">Registro:</span> {selectedUser.registeredAt ? new Date(selectedUser.registeredAt).toLocaleString('es-ES') : 'Sin dato'}</p>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
