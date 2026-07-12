import { NextResponse } from "next/server";
import { latestActiveLegalDocuments } from "@/app/lib/legal/compliance-catalog";
import { listActiveVideos, listLegalDocuments } from "@/app/backend/compliance/compliance-service";

export async function GET() {
  try {
    const [documents, videos] = await Promise.all([listLegalDocuments(), listActiveVideos()]);
    const activeDocuments = latestActiveLegalDocuments(documents);

    return NextResponse.json(
      {
        ok: true,
        data: {
          generatedAt: new Date().toISOString(),
          documents: activeDocuments,
          requiredBeforePayment: activeDocuments.filter((item) => item.requiredBeforePayment),
          videos: {
            publicHome: videos.filter((item) => item.scope === "public-home"),
            memberDashboard: videos.filter((item) => item.scope === "member-dashboard"),
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo obtener el catalogo legal y multimedia" }, { status: 500 });
  }
}
