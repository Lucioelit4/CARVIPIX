"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BackToDashboard from "../components/BackToDashboard";
import {
  supportUrl,
  telegramGroupUrl,
  trainingVideos,
  type TrainingVideo,
} from "./videos";

const COMPLETED_STORAGE_KEY = "carvipix-training-completed";

export default function AcademiaPage() {
  const [openVideoId, setOpenVideoId] = useState<number | null>(1);
  const [completedIds, setCompletedIds] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];

    const raw = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as number[];
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => Number.isInteger(id));
      }
    } catch {
      window.localStorage.removeItem(COMPLETED_STORAGE_KEY);
    }

    return [];
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedIds));
  }, [completedIds]);

  const selectedVideo = useMemo<TrainingVideo | undefined>(() => {
    return trainingVideos.find((video) => video.id === openVideoId);
  }, [openVideoId]);

  const markCompleted = (videoId: number) => {
    setCompletedIds((prev) => {
      if (prev.includes(videoId)) return prev;
      return [...prev, videoId];
    });
  };

  const openVideo = (videoId: number) => {
    setOpenVideoId(videoId);
    markCompleted(videoId);
  };

  const closeVideo = () => setOpenVideoId(null);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <BackToDashboard />

        <header className="mt-6 rounded-3xl border border-[#D4AF37]/25 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),rgba(10,10,10,0.98)_45%)] p-6 sm:p-10">
          <div className="flex items-center gap-4">
            <Image
              src="/logo/logo carvipix.png"
              alt="Logo CARVIPIX"
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-contain"
              priority
            />
            <div>
              <p className="text-xl font-semibold tracking-wide text-[#D4AF37]">CARVIPIX</p>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Centro de inicio</p>
            </div>
          </div>

          <div className="mt-8">
            <span className="inline-flex rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#F3D98B]">
              Capacitacion inicial
            </span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-5xl">
              Guia de inicio CARVIPIX
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Aprende los conceptos y herramientas necesarias antes de comenzar.
              Mira los videos en el orden indicado.
            </p>
            <p className="mt-5 text-sm font-medium text-[#F3D98B]">
              Progreso: {completedIds.length} de {trainingVideos.length} videos completados
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:gap-5">
          {trainingVideos.map((video) => {
            const isCompleted = completedIds.includes(video.id);

            return (
              <article
                key={video.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D0D] shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
              >
                <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                  <div className="relative min-h-[160px] md:min-h-full">
                    <Image
                      src={video.thumbnail}
                      alt={`Miniatura ${video.title}`}
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-[#D4AF37]/60 bg-black/65 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#F3D98B]">
                      {video.stepLabel}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-white sm:text-xl">{video.title}</h2>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">
                        {video.duration}
                      </span>
                      {isCompleted ? (
                        <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F3D98B]">
                          Completado
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                      {video.description}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openVideo(video.id)}
                        className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-4 py-2 text-sm font-semibold text-[#F3D98B] transition hover:bg-[#D4AF37]/20"
                      >
                        Ver video
                      </button>
                      <span className="text-xs text-zinc-500">Reproduccion dentro de la pagina</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {selectedVideo ? (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={closeVideo}
          >
            <div
              className="mx-auto w-full max-w-4xl rounded-2xl border border-[#D4AF37]/30 bg-[#080808] p-4 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">{selectedVideo.stepLabel}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white sm:text-2xl">{selectedVideo.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeVideo}
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                <video
                  key={selectedVideo.id}
                  controls
                  preload="metadata"
                  playsInline
                  poster={selectedVideo.thumbnail}
                  className="aspect-video w-full"
                  src={selectedVideo.videoUrl}
                >
                  Tu navegador no soporta reproduccion de video.
                </video>
              </div>
            </div>
          </div>
        ) : null}

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0D0D0D] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">¿Terminaste la capacitacion?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
            Despues de revisar todos los videos, podras comenzar a utilizar correctamente las herramientas y servicios indicados por CARVIPIX.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={telegramGroupUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-4 py-2 text-sm font-semibold text-[#F3D98B] transition hover:bg-[#D4AF37]/20"
            >
              Volver a Telegram
            </a>
            <a
              href={supportUrl}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
            >
              Soporte CARVIPIX
            </a>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs leading-6 text-zinc-500">
          Este contenido tiene fines informativos y educativos. Operar en mercados financieros implica riesgos. CARVIPIX no garantiza ganancias ni resultados especificos.
        </footer>
      </div>
    </main>
  );
}
