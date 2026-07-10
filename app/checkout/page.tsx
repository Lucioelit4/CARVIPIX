'use client';

import { Suspense } from 'react';
import CheckoutContent from './CheckoutContent';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303] text-white flex items-center justify-center"><p className="text-white/60">Checkout disponible cuando termine la carga.</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
