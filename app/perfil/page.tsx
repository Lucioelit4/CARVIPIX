'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Lock, Bell, Award, Shield, CreditCard, Edit2, Save, X, Crown, Users, Star, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { getCurrentUser } from '@/app/lib/data-helpers';

export default function PerfilPage() {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState({
    nombre: 'Abraham B.',
    correo: 'abraham@example.com',
    telefono: '+1 (555) 123-4567',
    pais: 'Estados Unidos',
    idioma: 'Español',
    zonaHoraria: 'UTC-5',
  });

  const [preferencias, setPreferencias] = useState({
    activosFavoritos: ['Oro', 'Forex', 'Crypto'],
    riesgoPreferido: 'Moderado',
    sesionFavorita: 'Nueva York',
    notificaciones: true,
  });

  // Load user data from modules on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserData(prev => ({
            ...prev,
            nombre: `${user.nombre} ${user.apellido}`,
            correo: user.email,
          }));
        }
      } catch (error) {
        console.log("Usando datos demo de perfil");
      }
    };

    loadUserData();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    setSaveMessage('✓ Perfil actualizado en modo demo.');
    setTimeout(() => setSaveMessage(''), 3000);
    setEditMode(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B111A] to-[#05070B] border-b border-white/5 px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-[#D4AF37]"
          >
            Mi cuenta CARVIPIX
          </motion.h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Premium Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#D4AF37]/10 to-[#0B111A] border border-[#D4AF37]/30 rounded-2xl p-8 mb-12 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Photo Section */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7500] flex items-center justify-center overflow-hidden border-4 border-[#D4AF37]">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-[#05070B]">AB</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#D4AF37] text-[#05070B] p-3 rounded-full hover:bg-[#E5C158] transition-all shadow-lg"
              >
                <Camera size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Info Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{userData.nombre}</h2>
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1 rounded-full text-xs font-bold">
                  MIEMBRO PRO
                </span>
              </div>
              <p className="text-[#D4AF37] font-semibold mb-4">Miembro CARVIPIX PRO</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Estado</p>
                  <p className="font-bold text-green-400">Activo</p>
                </div>
                <div>
                  <p className="text-white/60">ID Miembro</p>
                  <p className="font-bold">CVX-2026-001</p>
                </div>
                <div>
                  <p className="text-white/60">Ingreso</p>
                  <p className="font-bold">01/07/2026</p>
                </div>
                <div>
                  <p className="text-white/60">Renovación</p>
                  <p className="font-bold text-[#D4AF37]">18/07/2026</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            { label: 'Plan actual', value: 'CARVIPIX PRO', Icon: CreditCard },
            { label: 'Alertas recibidas', value: '24', Icon: Bell },
            { label: 'Operaciones seguidas', value: '18', Icon: BarChart3 },
            { label: 'Comunidad', value: 'Activa', Icon: Users },
            { label: 'Nivel', value: 'Premium', Icon: Star },
            { label: 'Estado de cuenta', value: 'Verificada demo', Icon: CheckCircle2 },
          ].map((card, i) => {
            const CardIcon = card.Icon;
            return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-[#0B111A] border border-white/10 rounded-lg p-6"
            >
              <CardIcon className="w-6 h-6 mb-2 text-[#D4AF37]" />
              <p className="text-white/60 text-sm mb-1">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </motion.div>
          );
          })}
        </motion.div>

        {/* Datos Personales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0B111A] border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Datos personales</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                editMode
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30'
              }`}
            >
              {editMode ? <X size={18} /> : <Edit2 size={18} />}
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {saveMessage && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-6 text-sm text-green-400">
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {Object.entries(userData).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-white/70 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type={key === 'correo' ? 'email' : 'text'}
                  value={value}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  disabled={!editMode}
                  className={`w-full px-4 py-2 rounded-lg border transition-all ${
                    editMode
                      ? 'bg-white/5 border-white/20 text-white focus:border-[#D4AF37] outline-none'
                      : 'bg-white/5 border-white/10 text-white/70 cursor-not-allowed'
                  }`}
                />
              </div>
            ))}
          </div>

          {editMode && (
            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-2 bg-[#D4AF37] text-[#05070B] font-bold py-3 px-6 rounded-lg hover:bg-[#E5C158] transition-all"
            >
              <Save size={18} />
              Guardar cambios
            </button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Preferencias de Trading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0B111A] border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold mb-6">Preferencias de trading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Activos favoritos</label>
                <div className="flex flex-wrap gap-2">
                  {preferencias.activosFavoritos.map((activo) => (
                    <span key={activo} className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-sm font-medium">
                      {activo}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Riesgo preferido</label>
                <select
                  value={preferencias.riesgoPreferido}
                  onChange={(e) => setPreferencias((prev) => ({ ...prev, riesgoPreferido: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
                >
                  <option>Bajo</option>
                  <option>Moderado</option>
                  <option>Medio-Alto</option>
                  <option>Alto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Sesión favorita</label>
                <select
                  value={preferencias.sesionFavorita}
                  onChange={(e) => setPreferencias((prev) => ({ ...prev, sesionFavorita: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] outline-none"
                >
                  <option>Asia</option>
                  <option>Londres</option>
                  <option>Nueva York</option>
                  <option>Solape Londres/NY</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/70">Notificaciones</label>
                <button
                  onClick={() => setPreferencias((prev) => ({ ...prev, notificaciones: !prev.notificaciones }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    preferencias.notificaciones
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {preferencias.notificaciones ? 'Activadas' : 'Desactivadas'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Seguridad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0B111A] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-bold">Seguridad de cuenta</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/70 text-sm mb-1">Contraseña</p>
                <p className="font-mono text-lg">••••••••</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/70 text-sm mb-1">Autenticación 2FA</p>
                <p className="text-yellow-400 font-medium">Pendiente</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/70 text-sm mb-1">Último acceso</p>
                <p className="text-white">hace 8 min</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/70 text-sm mb-1">Dispositivo</p>
                <p className="text-white">Chrome Windows</p>
              </div>
              <button className="w-full bg-[#D4AF37]/20 text-[#D4AF37] font-bold py-2 rounded-lg hover:bg-[#D4AF37]/30 transition-all">
                Configurar seguridad
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Membresía */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-[#D4AF37]/10 to-[#0B111A] border border-[#D4AF37]/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-bold">Membresía</h3>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-white/60 text-sm">Plan</p>
                <p className="text-xl font-bold text-[#D4AF37]">CARVIPIX PRO</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Renovación</p>
                <p className="text-lg font-bold">18/07/2026</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Estado</p>
                <p className="text-lg font-bold text-green-400">Activa</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-white/10 text-white font-bold py-2 rounded-lg hover:bg-white/20 transition-all">
                Ver planes
              </button>
              <button className="flex-1 bg-[#D4AF37] text-[#05070B] font-bold py-2 rounded-lg hover:bg-[#E5C158] transition-all">
                Actualizar membresía
              </button>
            </div>
          </motion.div>

          {/* Logros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#0B111A] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-bold">Logros CARVIPIX</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { text: 'Miembro fundador', Icon: Crown },
                { text: 'Primer mes activo', Icon: Clock },
                { text: 'Comunidad activa', Icon: Users },
                { text: 'Perfil completo', Icon: CheckCircle2 },
                { text: 'Gestión disciplinada', Icon: BarChart3 },
                { text: '5 señales seguidas', Icon: Award },
              ].map((logro, i) => {
                const LogroIcon = logro.Icon;
                return (
                <div key={i} className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3 text-sm flex items-center gap-2">
                  <LogroIcon className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span>{logro.text}</span>
                </div>
              );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
