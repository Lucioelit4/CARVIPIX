import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#0B0B0B] p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">Checkout Cancel</p>
        <h1 className="mt-3 text-3xl font-semibold">Pago cancelado</h1>
        <p className="mt-4 text-white/75">
          El flujo de pago fue cancelado por el usuario. No se activo membresia ni acceso comercial.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkout" className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">Intentar nuevamente</Link>
          <Link href="/dashboard" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5">Ir al dashboard</Link>
        </div>
      </div>
    </main>
  );
}
