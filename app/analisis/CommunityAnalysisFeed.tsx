"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import type { CommunityPublication } from "@/app/lib/community-intelligence/types";

export function CommunityAnalysisFeed() {
  const [publications, setPublications] = useState<CommunityPublication[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/internal/community-intelligence/feed?limit=12")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Feed unavailable"))))
      .then((payload: { publications?: CommunityPublication[] }) => {
        if (active) setPublications(payload.publications ?? []);
      })
      .catch(() => {
        if (active) setPublications([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (publications.length === 0) return null;

  return (
    <section className="mb-10 border-y border-[#D4AF37]/25 bg-[#080808] py-7" aria-labelledby="community-analysis-title">
      <div className="mb-5 flex items-center gap-3">
        <Newspaper className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
        <div>
          <h2 id="community-analysis-title" className="text-xl font-semibold">Panorama informativo</h2>
          <p className="text-sm text-white/50">Contexto de mercado separado de las Alertas Oficiales</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {publications.map((publication) => (
          <article key={publication.publication_id} className="overflow-hidden rounded-lg border border-white/10 bg-[#0B0B0B]">
            {publication.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${publication.image.mime_type};base64,${publication.image.bytes_base64}`}
                alt="Portada institucional ilustrativa"
                className="aspect-[3/2] w-full object-cover"
              />
            ) : null}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/45">
                <span>{publication.asset}</span>
                <time dateTime={publication.created_at}>{new Date(publication.created_at).toLocaleDateString("es-MX")}</time>
              </div>
              <h3 className="text-base font-semibold text-white">{publication.content.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-[#D4AF37]">
                {publication.labels.map((label) => <span key={label}>{label}</span>)}
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-white/65">{publication.content.body}</p>
              <p className="mt-3 border-t border-white/10 pt-3 text-xs text-[#D4AF37]/80">{publication.content.disclaimer}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}