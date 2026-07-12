import Link from "next/link";

export default async function CheckoutErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const message = params.message || "Error inesperado en el flujo de PayPal.";

  return (
    <main className="min-h-screen bg-[#030303] text-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/40 bg-[#0B0B0B] p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-red-300">Checkout Error</p>
        <h1 className="mt-3 text-3xl font-semibold">No se pudo completar el pago</h1>
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-100">{message}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkout" className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">Volver a checkout</Link>
          <Link href="/soporte" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5">Contactar soporte</Link>
        </div>
      </div>
    </main>
  );
}
