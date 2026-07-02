'use client';

import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import DetailModal from './DetailModal';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: 'activo' | 'inactivo' | 'suspendido';
  registered: string;
}

export default function AdminUsuarios() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load users from localStorage or use demo data
    const demoUsers: User[] = [
      { id: '#1247', name: 'Juan Pérez', email: 'juan@email.com', plan: 'PRO', status: 'activo', registered: '2026-06-15' },
      { id: '#1246', name: 'María García', email: 'maria@email.com', plan: 'ELITE', status: 'activo', registered: '2026-06-10' },
      { id: '#1245', name: 'Carlos López', email: 'carlos@email.com', plan: 'Free', status: 'activo', registered: '2026-06-08' },
      { id: '#1244', name: 'Ana Martínez', email: 'ana@email.com', plan: 'PRO', status: 'inactivo', registered: '2026-05-20' },
      { id: '#1243', name: 'Roberto Silva', email: 'roberto@email.com', plan: 'ELITE', status: 'activo', registered: '2026-05-15' },
      { id: '#1242', name: 'Laura Gómez', email: 'laura@email.com', plan: 'Free', status: 'suspendido', registered: '2026-05-10' },
      { id: '#1241', name: 'Miguel Torres', email: 'miguel@email.com', plan: 'PRO', status: 'activo', registered: '2026-04-28' },
      { id: '#1240', name: 'Sofia Ruiz', email: 'sofia@email.com', plan: 'ELITE', status: 'activo', registered: '2026-04-15' },
    ];
    setUsers(demoUsers);
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getPlanColor = (plan: string) => {
    if (plan === 'ELITE') return 'bg-purple-500/20 text-purple-300';
    if (plan === 'PRO') return 'bg-[#D4AF37]/20 text-[#D4AF37]';
    return 'bg-white/10 text-white/70';
  };

  const getStatusColor = (status: string) => {
    if (status === 'activo') return 'bg-green-500/20 text-green-300';
    if (status === 'inactivo') return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
        <p className="text-white/60">Lista de usuarios registrados en CARVIPIX</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
      >
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
              {filteredUsers.map((user, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-sm text-white/70 font-mono">{user.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-white/60">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded capitalize ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">{user.registered}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded hover:bg-white/10 transition flex items-center gap-1 text-white text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No se encontraron usuarios</p>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Total usuarios</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Activos hoy</p>
          <p className="text-2xl font-bold text-green-400">342</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 mb-2">Nuevos esta semana</p>
          <p className="text-2xl font-bold text-[#D4AF37]">87</p>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Perfil de Usuario"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* ID y Plan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">ID de Usuario</p>
                <p className="font-mono text-sm text-[#D4AF37]">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Plan</p>
                <span className={`text-xs font-bold px-2 py-1 rounded w-fit block ${getPlanColor(selectedUser.plan)}`}>
                  {selectedUser.plan}
                </span>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <p className="text-xs text-white/60 mb-1">Nombre</p>
              <p className="text-white font-semibold text-lg">{selectedUser.name}</p>
            </div>

            {/* Email */}
            <div>
              <p className="text-xs text-white/60 mb-1">Correo Electrónico</p>
              <p className="text-white font-mono text-sm">{selectedUser.email}</p>
            </div>

            {/* Estado */}
            <div>
              <p className="text-xs text-white/60 mb-1">Estado de Cuenta</p>
              <span className={`text-xs font-bold px-3 py-1 rounded capitalize w-fit block ${getStatusColor(selectedUser.status)}`}>
                {selectedUser.status}
              </span>
            </div>

            {/* Fecha de Registro */}
            <div>
              <p className="text-xs text-white/60 mb-1">Fecha de Registro</p>
              <p className="text-white/70">{selectedUser.registered}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Información */}
            <div>
              <p className="text-xs text-white/60 mb-2">Información de Cuenta</p>
              <div className="bg-white/5 rounded p-3 text-sm text-white/70 space-y-2">
                <p>• Tipo de plan: <span className="text-white font-semibold">{selectedUser.plan}</span></p>
                <p>• Estado: <span className="text-white font-semibold capitalize">{selectedUser.status}</span></p>
                <p>• Miembro desde: <span className="text-white font-semibold">{selectedUser.registered}</span></p>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
