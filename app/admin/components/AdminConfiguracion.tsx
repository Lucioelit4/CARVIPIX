'use client';

import { motion } from 'framer-motion';
import { Settings, DollarSign, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CARVIPIXBadge, CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';
import { getAlertStats, getAllProducts, getFundingSnapshot, getPlatformResults } from '@/app/lib/client-data-helpers';

export default function AdminConfiguracion() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [precios, setPrecios] = useState<Array<{ producto: string; precio: string; currency: string; tipo: string }>>([]);
  const [servicios, setServicios] = useState<Array<{ nombre: string; estado: string; usuarios: number }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [products, alertStats, results, funding] = await Promise.all([
          getAllProducts(),
          getAlertStats(),
          getPlatformResults('monthly'),
          getFundingSnapshot(),
        ]);

        setPrecios(
          products.map((p) => ({
            producto: p.name,
            precio: p.price > 0 ? `$${p.price.toLocaleString()}` : '$0',
            currency: p.currency,
            tipo: p.oneTime ? 'one-time' : 'subscription',
          }))
        );

        setServicios([
          { nombre: 'Sala de Alertas', estado: alertStats.active > 0 ? 'activo' : 'sin datos', usuarios: Number(results.combinedStats.userCount ?? 0) },
          { nombre: 'Resultados', estado: Number(results.combinedStats.totalTrades ?? 0) > 0 ? 'activo' : 'sin datos', usuarios: Number(results.combinedStats.userCount ?? 0) },
          { nombre: 'Fondeo', estado: Number(funding.activePrograms ?? 0) > 0 ? 'activo' : 'sin datos', usuarios: Number(funding.approvedAccounts ?? 0) },
        ]);
      } catch {
        setPrecios([]);
        setServicios([]);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-2">Configuración del Sistema</h2>
        <p className="text-white/60">Gestión de precios, servicios y estados</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <CARVIPIXCard variant="admin" padding="24" hover={false}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4AF37]" />
            Configuración Global
          </h3>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="font-semibold text-white mb-1">Origen de datos</p>
                <p className="text-sm text-white/60">APIs y client-data-helpers</p>
              </div>
              <CARVIPIXButton variant="success" size="sm">Activo</CARVIPIXButton>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <p className="font-semibold text-white mb-1">Modo Mantenimiento</p>
                <p className="text-sm text-white/60">Suspende acceso para usuarios regulares</p>
              </div>
              <CARVIPIXButton onClick={() => setMaintenanceMode(!maintenanceMode)} variant={maintenanceMode ? 'danger' : 'success'} size="sm">
                {maintenanceMode ? 'Activado' : 'Desactivado'}
              </CARVIPIXButton>
            </div>
          </div>

          {maintenanceMode && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-300 mb-1">Modo de mantenimiento activo</p>
                <p className="text-sm text-yellow-300/70">Los usuarios verán un mensaje de mantenimiento</p>
              </div>
            </motion.div>
          )}
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <CARVIPIXCard variant="admin" padding="16" hover={false}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg font-bold">Precios de Productos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Producto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Precio</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Moneda</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {precios.length === 0 ? (
                  <tr><td className="px-6 py-6 text-white/60" colSpan={4}>Sin datos</td></tr>
                ) : (
                  precios.map((item) => (
                    <tr key={item.producto} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-sm font-medium text-white">{item.producto}</td>
                      <td className="px-6 py-4 text-sm text-white font-semibold">{item.precio}</td>
                      <td className="px-6 py-4 text-sm text-white/70">{item.currency}</td>
                      <td className="px-6 py-4"><CARVIPIXBadge variant="default">{item.tipo}</CARVIPIXBadge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CARVIPIXCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CARVIPIXCard variant="admin" padding="24" hover={false}>
          <h3 className="text-lg font-bold mb-4">Estado de Servicios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servicios.length === 0 ? (
              <p className="text-white/60">Sin datos</p>
            ) : (
              servicios.map((servicio) => (
                <div key={servicio.nombre} className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white mb-1">{servicio.nombre}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-2 rounded-full bg-green-400"></span>{servicio.estado}</span>
                      <span className="text-white/60">{servicio.usuarios} usuarios</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CARVIPIXCard>
      </motion.div>
    </div>
  );
}
