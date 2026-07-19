"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

type FormModel = {
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  companyOrBrand: string;
  mainActivity: string;
  yearsExperience: string;
  profileDescription: string;
  platforms: string;
  links: string;
  followersApprox: string;
  primaryCountries: string;
  communityType: string;
  motivation: string;
  contribution: string;
  presentationStrategy: string;
  confirmTrueInfo: boolean;
  confirmPrivacy: boolean;
  confirmNonGuarantee: boolean;
  confirmContactAuth: boolean;
  legalDisclaimerAck: boolean;
  legalNonContractAck: boolean;
};

const initialForm: FormModel = {
  fullName: "",
  email: "",
  whatsapp: "",
  country: "",
  city: "",
  companyOrBrand: "",
  mainActivity: "",
  yearsExperience: "",
  profileDescription: "",
  platforms: "",
  links: "",
  followersApprox: "",
  primaryCountries: "",
  communityType: "",
  motivation: "",
  contribution: "",
  presentationStrategy: "",
  confirmTrueInfo: false,
  confirmPrivacy: false,
  confirmNonGuarantee: false,
  confirmContactAuth: false,
  legalDisclaimerAck: false,
  legalNonContractAck: false,
};

function normalizeList(value: string): string[] {
  return value
    .split(/\n|,|;/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SolicitudSociosEstrategicosPage() {
  const [form, setForm] = useState<FormModel>(initialForm);
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const allConfirmationsChecked = useMemo(
    () =>
      form.confirmTrueInfo &&
      form.confirmPrivacy &&
      form.confirmNonGuarantee &&
      form.confirmContactAuth &&
      form.legalDisclaimerAck &&
      form.legalNonContractAck,
    [form]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setError("");

    const payload = {
      fullName: form.fullName,
      email: form.email,
      whatsapp: form.whatsapp,
      country: form.country,
      city: form.city,
      companyOrBrand: form.companyOrBrand,
      mainActivity: form.mainActivity,
      yearsExperience: Number(form.yearsExperience || 0),
      profileDescription: form.profileDescription,
      platforms: normalizeList(form.platforms),
      links: normalizeList(form.links),
      followersApprox: form.followersApprox,
      primaryCountries: form.primaryCountries,
      communityType: form.communityType,
      motivation: form.motivation,
      contribution: form.contribution,
      presentationStrategy: form.presentationStrategy,
      confirmTrueInfo: form.confirmTrueInfo,
      confirmPrivacy: form.confirmPrivacy,
      confirmNonGuarantee: form.confirmNonGuarantee,
      confirmContactAuth: form.confirmContactAuth,
      legalDisclaimerAck: form.legalDisclaimerAck,
      legalNonContractAck: form.legalNonContractAck,
    };

    try {
      const response = await fetch("/api/public/strategic-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo enviar la solicitud");
      }

      setApplicationId(data.id || "");
      setState("success");
      setForm(initialForm);
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "No se pudo enviar la solicitud");
    }
  };

  if (state === "success") {
    return (
      <main className="min-h-screen bg-[#060606] px-6 py-14 text-white sm:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#111111_0%,#0A0A0A_100%)] p-8 md:p-12">
          <div className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Solicitud registrada correctamente</h1>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Hemos recibido tu solicitud para Socios Estrategicos CARVIPIX. Nuestro equipo realizara una evaluacion
            interna y te contactara si tu perfil avanza a la siguiente etapa.
          </p>
          <p className="mt-4 text-sm text-[#E6CA7B]">ID de solicitud: {applicationId || "No disponible"}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/socios-estrategicos" className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black hover:bg-[#E8C96D]">
              Volver a Socios Estrategicos
            </Link>
            <Link href="/servicios" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/5">
              Ir a servicios
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-8 md:py-16">
        <Link href="/socios-estrategicos" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft size={16} />
          Volver
        </Link>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.18),transparent_38%),linear-gradient(180deg,#111111_0%,#0A0A0A_100%)] p-7 md:p-10">
          <h1 className="text-3xl font-semibold md:text-4xl">Solicitud de evaluacion</h1>
          <p className="mt-3 text-sm text-white/70">
            Completa la informacion de forma precisa. Cada solicitud es evaluada individualmente por el equipo
            interno de CARVIPIX.
          </p>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Informacion personal</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input required value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nombre completo" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Correo" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Pais" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Ciudad" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] md:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Perfil</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input required value={form.companyOrBrand} onChange={(e) => setForm((p) => ({ ...p, companyOrBrand: e.target.value }))} placeholder="Empresa, marca o comunidad" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.mainActivity} onChange={(e) => setForm((p) => ({ ...p, mainActivity: e.target.value }))} placeholder="Actividad principal" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} placeholder="Años de experiencia" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <textarea required value={form.profileDescription} onChange={(e) => setForm((p) => ({ ...p, profileDescription: e.target.value }))} placeholder="Descripcion profesional" className="min-h-28 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] md:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Comunidad</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <textarea value={form.platforms} onChange={(e) => setForm((p) => ({ ...p, platforms: e.target.value }))} placeholder="Plataformas (separa por coma o salto de linea)" className="min-h-24 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <textarea value={form.links} onChange={(e) => setForm((p) => ({ ...p, links: e.target.value }))} placeholder="Links (separa por coma o salto de linea)" className="min-h-24 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.followersApprox} onChange={(e) => setForm((p) => ({ ...p, followersApprox: e.target.value }))} placeholder="Seguidores aproximados" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.primaryCountries} onChange={(e) => setForm((p) => ({ ...p, primaryCountries: e.target.value }))} placeholder="Paises principales" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <input required value={form.communityType} onChange={(e) => setForm((p) => ({ ...p, communityType: e.target.value }))} placeholder="Tipo de comunidad" className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] md:col-span-2" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Evaluacion</h2>
              <div className="mt-4 grid gap-4">
                <textarea required value={form.motivation} onChange={(e) => setForm((p) => ({ ...p, motivation: e.target.value }))} placeholder="¿Por que desea formar parte de Socios Estrategicos CARVIPIX?" className="min-h-24 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <textarea required value={form.contribution} onChange={(e) => setForm((p) => ({ ...p, contribution: e.target.value }))} placeholder="¿Que puede aportar a CARVIPIX?" className="min-h-24 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
                <textarea required value={form.presentationStrategy} onChange={(e) => setForm((p) => ({ ...p, presentationStrategy: e.target.value }))} placeholder="¿Como presentaria CARVIPIX a su comunidad?" className="min-h-24 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">Confirmaciones y clausulas</h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.confirmTrueInfo} onChange={(e) => setForm((p) => ({ ...p, confirmTrueInfo: e.target.checked }))} className="mt-1" />Confirmo que la informacion proporcionada es veridica.</label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.confirmPrivacy} onChange={(e) => setForm((p) => ({ ...p, confirmPrivacy: e.target.checked }))} className="mt-1" />Acepto la politica de privacidad y tratamiento de datos.</label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.confirmNonGuarantee} onChange={(e) => setForm((p) => ({ ...p, confirmNonGuarantee: e.target.checked }))} className="mt-1" />Entiendo que esta solicitud no garantiza aceptacion.</label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.confirmContactAuth} onChange={(e) => setForm((p) => ({ ...p, confirmContactAuth: e.target.checked }))} className="mt-1" />Autorizo ser contactado por CARVIPIX.</label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.legalDisclaimerAck} onChange={(e) => setForm((p) => ({ ...p, legalDisclaimerAck: e.target.checked }))} className="mt-1" />CARVIPIX se reserva el derecho de aceptar o rechazar cualquier solicitud, sin obligacion de expresar las razones de su decision.</label>
                <label className="flex items-start gap-3"><input type="checkbox" checked={form.legalNonContractAck} onChange={(e) => setForm((p) => ({ ...p, legalNonContractAck: e.target.checked }))} className="mt-1" />La aprobacion de una solicitud no constituye relacion laboral, societaria, financiera ni contractual hasta la firma del acuerdo correspondiente.</label>
              </div>
            </section>

            {state === "error" && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={state === "submitting" || !allConfirmationsChecked}
              className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-7 py-3 text-sm font-bold text-black transition enabled:hover:bg-[#E8C96D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "submitting" ? "Enviando solicitud..." : "Enviar solicitud"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
