'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function EnginePagePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a admin
    router.push('/admin?tab=motor');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#05070B] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full p-4">
            <Lock className="w-8 h-8 text-[#D4AF37]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Acceso Restringido</h1>
          <p className="text-white/70 text-sm">
            Esta sección está disponible solo en el panel administrativo.
          </p>
        </div>

        <div className="text-sm text-white/60">
          Redirigiendo al panel de control...
        </div>
      </motion.div>
    </div>
  );
}
