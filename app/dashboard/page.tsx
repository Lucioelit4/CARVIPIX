'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentRole, writeAuthSession } from '@/app/lib/auth/session';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (getCurrentRole() === 'invitado') {
      writeAuthSession('cliente');
    }

    router.replace('/alertas');
  }, [router]);

  return (
    <main className="min-h-screen bg-[#05070B] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60">Preparando dashboard...</p>
      </div>
    </main>
  );
}