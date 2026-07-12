import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; id?: string }>;
}) {
  const params = await searchParams;
  const kind = params.kind || "order";
  const id = params.id || "";

  return (
    <Suspense fallback={<main className="min-h-screen bg-[#030303] text-white px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl">Verificando estado de pago...</div></main>}>
      <SuccessContent kind={kind} id={id} />
    </Suspense>
  );
}
