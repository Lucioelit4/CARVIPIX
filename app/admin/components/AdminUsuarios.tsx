'use client';

import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import DetailModal from './DetailModal';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { getCurrentMembership, getCurrentUser } from '@/app/lib/client-data-helpers';

type UserRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: 'activo' | 'inactivo' | 'suspendido';
  registered: string;
};

export default function AdminUsuarios() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [user, membership] = await Promise.all([getCurrentUser(), getCurrentMembership()]);
        if (!user?.id) {
          setUsers([]);
          return;
        }

        setUsers([
          {
            id: user.id,
            name: `${user.nombre} ${user.apellido}`.trim() || 'Sin datos',
            email: user.email || 'Sin datos',
            plan: String(membership?.plan ?? user.plan ?? 'demo').toUpperCase(),
            status: (user.estado ?? 'inactivo') as UserRow['status'],
            registered: user.fechaActivacion ? new Date(user.fechaActivacion).toLocaleDateString('es-ES') : 'Sin datos',
          },
        ]);
      } catch {
        setUsers([]);
      }
    };

    load();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
        <p className="text-white/60">Lista de usuarios registrados en CARVIPIX</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Registro</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-sm text-white/70 font-mono">{user.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{user.email}</td>
                    <td className="px-6 py-4">
                      <CARVIPIXBadge variant={user.plan === 'ENTERPRISE' ? 'admin' : user.plan === 'PRO' ? 'premium' : 'default'}>{user.plan}</CARVIPIXBadge>
                    </td>
                    <td className="px-6 py-4">
                      <CARVIPIXBadge variant={user.status === 'activo' ? 'success' : user.status === 'inactivo' ? 'warning' : 'danger'}>{user.status}</CARVIPIXBadge>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{user.registered}</td>
                    <td className="px-6 py-4 text-right">
                      <CARVIPIXButton
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Ver
                      </CARVIPIXButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50">Sin datos</p>
            </div>
          )}
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Total usuarios</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Activos hoy</p>
          <p className="text-2xl font-bold text-green-400">{users.filter((u) => u.status === 'activo').length}</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-white/60 mb-2">Nuevos esta semana</p>
          <p className="text-2xl font-bold text-[#D4AF37]">0</p>
        </CARVIPIXCard>
      </motion.div>

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Perfil de Usuario">
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">ID de Usuario</p>
                <p className="font-mono text-sm text-[#D4AF37]">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Plan</p>
                <CARVIPIXBadge variant={selectedUser.plan === 'ENTERPRISE' ? 'admin' : selectedUser.plan === 'PRO' ? 'premium' : 'default'}>{selectedUser.plan}</CARVIPIXBadge>
              </div>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Nombre</p>
              <p className="text-white font-semibold text-lg">{selectedUser.name}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">Correo Electrónico</p>
              <p className="text-white font-mono text-sm">{selectedUser.email}</p>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
