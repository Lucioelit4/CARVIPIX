"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Users, ShieldCheck, MessageSquare, Zap, Check } from "lucide-react";
import { getCurrentUser } from "@/app/lib/data-helpers";

type Message = {
  id: string;
  author: string;
  role?: string;
  text: string;
  time: string;
  admin?: boolean;
};

const initialMessages: Message[] = [
  { id: "m1", author: "Equipo CARVIPIX", role: "Equipo", text: "Buenos días equipo, hoy estaremos atentos a XAUUSD y EURUSD durante sesión NY.", time: "09:02", admin: true },
  { id: "m2", author: "María", role: "Miembro PRO", text: "¿La entrada de oro sigue válida?", time: "09:04" },
  { id: "m3", author: "Equipo CARVIPIX", role: "Equipo", text: "Sí, mientras respete la zona de protección marcada.", time: "09:05", admin: true },
  { id: "m4", author: "Diego", role: "Miembro", text: "Gracias, ya marqué gestión parcial.", time: "09:08" },
  { id: "m5", author: "Lucio", role: "Miembro PRO", text: "Reduciré el tamaño de lote para XAUUSD, mejor gestión de riesgo.", time: "09:12" },
  { id: "m6", author: "Sofía", role: "Miembro", text: "He compartido una captura en #gestion para revisar niveles.", time: "09:14" },
];

const profanity = ["puta", "mierda", "idiota", "fuck", "shit"];

function formatTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ComunidadPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [onlineCount] = useState(128);
  const [userName, setUserName] = useState("Abraham");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load user data from modules on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserName(user.nombre);
        }
      } catch (error) {
        console.log("Usando datos demo de comunidad");
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const containsProfanity = (text: string) => {
    const lower = text.toLowerCase();
    return profanity.some((w) => lower.includes(w));
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    if (containsProfanity(input)) {
      setNotice("Tu mensaje debe cumplir las reglas de convivencia.");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      author: "Tú",
      role: "Miembro PRO",
      text: input.trim(),
      time: formatTime(),
    };
    setMessages((s) => [...s, newMsg]);
    setInput("");
  };

  return (
    <main className="min-h-screen bg-[#05070B] text-white px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]/80">Comunidad privada</p>
            <h1 className="mt-2 text-3xl font-semibold">Comunidad CARVIPIX</h1>
            <p className="mt-1 text-sm text-zinc-300">Sala privada para seguimiento, dudas y acompañamiento operativo.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">Miembro PRO activo</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">Comunidad moderada</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">Vista demo</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">Online ahora: {onlineCount}</span>
            </div>
          </div>
          <div className="mt-3 md:mt-0 text-sm text-zinc-400 flex items-center gap-3">
            <Users size={18} /> <span>Equipo conectado</span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Chat column */}
          <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4 flex flex-col h-[70vh] max-h-[80vh]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-zinc-300" />
                <h2 className="text-lg font-semibold">Chat principal</h2>
              </div>
              <div className="text-xs text-zinc-400">Moderado • Ver reglas</div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto pr-2 space-y-2">
              <div className="text-xs text-zinc-400 text-center">Hoy</div>

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] ${m.admin ? "ml-0 bg-gradient-to-r from-[#2b220d]/10 via-transparent to-transparent border border-[#D4AF37]/20 text-white" : "ml-auto bg-[#0B1320] text-zinc-200"} rounded-xl p-3`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-semibold ${m.admin ? "text-[#D4AF37]" : "text-zinc-200"}`}>{m.author}</span>
                    <span className="text-xs text-zinc-400">{m.role}</span>
                    <span className="text-xs text-zinc-500 ml-2">{m.time}</span>
                  </div>
                  <div className="mt-1 text-sm leading-6">{m.text}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-2 border-t border-white/5 py-2">
              {notice ? <div className="mb-2 text-sm text-red-400">{notice}</div> : null}
              <div className="mb-1 text-xs text-zinc-400">Filtro activo: lenguaje respetuoso</div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 rounded-xl bg-[#061018] px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-[#D4AF37] px-3 py-2 text-black flex items-center gap-2"
                >
                  <Send size={16} /> Enviar
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Reglas de la comunidad</h3>
              <ul className="mt-3 text-sm text-zinc-300 space-y-2">
                <li className="flex items-start gap-2"><ShieldCheck className="text-[#D4AF37]" /> Respeto obligatorio</li>
                <li className="flex items-start gap-2"><Zap className="text-zinc-300" /> No spam</li>
                <li className="flex items-start gap-2"><Check className="text-zinc-300" /> No prometer ganancias</li>
                <li className="flex items-start gap-2"><Users className="text-zinc-300" /> Seguir indicaciones del equipo</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Canales activos</h3>
              <ul className="mt-3 text-sm text-zinc-300 space-y-2">
                <li className="flex items-center justify-between"><span>Alertas en Vivo</span><span className="text-xs text-zinc-400">#alerts</span></li>
                <li className="flex items-center justify-between"><span>Gestión de señales</span><span className="text-xs text-zinc-400">#gestion</span></li>
                <li className="flex items-center justify-between"><span>Dudas de miembros</span><span className="text-xs text-zinc-400">#preguntas</span></li>
                <li className="flex items-center justify-between"><span>Noticias importantes</span><span className="text-xs text-zinc-400">#news</span></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Estado de sala</h3>
              <div className="mt-3 text-sm text-zinc-300 space-y-2">
                <div className="flex items-center justify-between"><span>Moderadores</span><span>3</span></div>
                <div className="flex items-center justify-between"><span>Miembros online</span><span>{onlineCount}</span></div>
                <div className="flex items-center justify-between"><span>Última actualización</span><span className="text-xs text-zinc-400">hace 2 min</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111A]/90 p-4">
              <h3 className="text-sm font-semibold text-[#D4AF37]">Confianza</h3>
              <p className="mt-2 text-sm text-zinc-300">Esta comunidad está diseñada para acompañar al miembro durante la operativa, resolver dudas y mantener comunicación clara sobre las señales.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
// duplicate block removed