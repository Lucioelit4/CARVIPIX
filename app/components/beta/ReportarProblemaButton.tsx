'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ChevronDown, Send, Paperclip } from 'lucide-react';
import { CARVIPIXButton } from '@/app/design-system';

const CATEGORIES = [
  { value: 'instalacion', label: '⚙️ Instalación' },
  { value: 'plataforma', label: '🖥️ Plataforma' },
  { value: 'telegram', label: '💬 Telegram' },
  { value: 'bot', label: '🤖 Bot' },
  { value: 'alertas', label: '🔔 Alertas' },
  { value: 'licencia', label: '🔑 Licencia' },
  { value: 'pago', label: '💳 Pago' },
  { value: 'rendimiento', label: '📈 Rendimiento' },
  { value: 'otro', label: '❓ Otro' },
];

const PRIORITIES = [
  { value: 'baja', label: '🟢 Baja' },
  { value: 'media', label: '🟡 Media' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'critica', label: '🔴 Crítica' },
];

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ReportarProblemaButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    category: 'plataforma',
    priority: 'media',
    description: '',
  });

  const reset = () => {
    setForm({ category: 'plataforma', priority: 'media', description: '' });
    setStatus('idle');
  };

  const submit = async () => {
    if (form.description.trim().length < 10) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/beta/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          priority: form.priority,
          description: form.description.trim(),
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean };
      setStatus(payload.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-full shadow-2xl font-semibold text-sm transition-colors"
        title="Reportar un problema"
      >
        <AlertCircle className="w-4 h-4" />
        Reportar Problema
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-md h-fit rounded-2xl border border-white/10 bg-gradient-to-b from-[#0B0B0B] to-[#030303] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-red-900/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h2 className="font-bold text-white">Reportar Problema</h2>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {status === 'success' ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                      <span className="text-3xl">✅</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">Reporte enviado</p>
                      <p className="text-white/60 text-sm mt-1">El equipo lo revisará pronto. Gracias por tu feedback.</p>
                    </div>
                    <CARVIPIXButton variant="ghost" onClick={() => setOpen(false)}>Cerrar</CARVIPIXButton>
                  </div>
                ) : (
                  <>
                    {/* Categoría */}
                    <div>
                      <label className="text-xs font-semibold text-white/60 block mb-1">Módulo afectado</label>
                      <div className="relative">
                        <select
                          value={form.category}
                          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm appearance-none focus:border-[#D4AF37] outline-none"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value} className="bg-[#0B0B0B]">{c.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/40 pointer-events-none" />
                      </div>
                    </div>

                    {/* Prioridad */}
                    <div>
                      <label className="text-xs font-semibold text-white/60 block mb-1">Prioridad</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRIORITIES.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                            className={`py-2 px-1 rounded-lg text-xs font-medium text-center transition border ${
                              form.priority === p.value
                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                                : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20'
                            }`}
                          >
                            {p.label.split(' ')[0]}<br />{p.label.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="text-xs font-semibold text-white/60 block mb-1">Descripción del problema</label>
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe qué ocurrió, qué esperabas y qué obtuviste..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:border-[#D4AF37] outline-none placeholder-white/30"
                      />
                      <p className={`text-xs mt-1 ${form.description.length < 10 ? 'text-red-400' : 'text-white/40'}`}>
                        {form.description.length} / mín. 10 caracteres
                      </p>
                    </div>

                    {status === 'error' && (
                      <p className="text-xs text-red-400">No se pudo enviar el reporte. Intenta de nuevo.</p>
                    )}

                    <CARVIPIXButton
                      variant="primary"
                      fullWidth
                      disabled={form.description.trim().length < 10 || status === 'sending'}
                      isLoading={status === 'sending'}
                      leftIcon={<Send className="w-4 h-4" />}
                      onClick={() => void submit()}
                    >
                      Enviar reporte
                    </CARVIPIXButton>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
