import type { Metadata } from "next";
import TrustNav from "../_components/TrustNav";

export const metadata: Metadata = {
  title: "Preguntas dificiles | CARVIPIX Trust Center",
  description: "Respuestas directas a preguntas que suelen generar desconfianza en usuarios.",
  alternates: { canonical: "https://carvipix.com/trust-center/preguntas-dificiles" },
};

const qa = [
  {
    q: "Por que algunas operaciones terminan en perdida?",
    a: "Porque los mercados financieros son variables y no existe resultado asegurado. CARVIPIX publica herramientas y criterios operativos, pero no elimina el riesgo de mercado.",
  },
  {
    q: "Por que algunos dias no existen alertas?",
    a: "Porque la plataforma no debe forzar actividad cuando no hay condiciones validas segun su metodologia operativa.",
  },
  {
    q: "Por que CARVIPIX no garantiza ganancias?",
    a: "Porque ninguna plataforma responsable puede garantizar resultado futuro en mercados. La politica publica de CARVIPIX excluye promesas de rentabilidad.",
  },
  {
    q: "Por que existen diferentes planes?",
    a: "Porque los servicios se ofrecen por niveles de acceso, herramientas y soporte, segun el uso operativo de cada usuario.",
  },
  {
    q: "CARVIPIX recibe dinero para invertirlo por mi?",
    a: "No. CARVIPIX no recibe dinero del usuario para invertir, no administra fondos y no tiene acceso al dinero del usuario en cuentas externas.",
  },
];

export default function TrustPreguntasDificilesPage() {
  return (
    <main className="min-h-screen bg-[#030303] text-white">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:px-8 lg:grid-cols-[300px,1fr]">
        <TrustNav currentPath="/trust-center/preguntas-dificiles" />
        <article className="rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-7">
          <h1 className="text-3xl font-bold text-[#D4AF37]">Preguntas dificiles</h1>
          <p className="mt-3 text-zinc-300">Respuestas directas, sin lenguaje promocional y con enfoque de transparencia.</p>

          <div className="mt-8 space-y-4">
            {qa.map((item) => (
              <section key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h2 className="text-lg font-semibold text-white">{item.q}</h2>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
