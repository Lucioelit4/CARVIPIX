import { NextResponse } from "next/server";

import { relatedFaq, searchOfficialFaq } from "@/app/lib/support/official-knowledge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") ?? "").trim();
  const category = (String(url.searchParams.get("category") ?? "all").trim() || "all") as
    | "all"
    | "empresa"
    | "alertas"
    | "bot"
    | "membresias"
    | "pagos"
    | "facturacion"
    | "gestion-capital"
    | "fondeo"
    | "resultados"
    | "comunidad"
    | "soporte"
    | "problemas-tecnicos"
    | "cuenta"
    | "seguridad"
    | "legal"
    | "administracion";
  const popularOnly = String(url.searchParams.get("popular") ?? "false").toLowerCase() === "true";
  const relatedTo = String(url.searchParams.get("relatedTo") ?? "").trim();

  const data = searchOfficialFaq({ query: q, category, popularOnly, limit: 40 });
  const related = relatedTo ? relatedFaq(relatedTo, 6) : [];

  return NextResponse.json(
    {
      data,
      related,
    },
    { status: 200 }
  );
}
