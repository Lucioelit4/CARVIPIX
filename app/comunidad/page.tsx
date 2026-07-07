"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bot,
  ChartColumnBig,
  CircleHelp,
  FolderClock,
  Gauge,
  Gem,
  Hash,
  Heart,
  LayoutGrid,
  Paperclip,
  Rocket,
  Search,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/app/lib/client-data-helpers";
import { CARVIPIXBadge, CARVIPIXCard } from "@/app/design-system";

type CommunityRole = "Equipo CARVIPIX" | "Moderador" | "Miembro PRO" | "Miembro";
type ReactionKey = "like" | "love" | "fire" | "check" | "eyes";

type ChatMessage = {
  id: string;
  user: string;
  role: CommunityRole;
  avatar: string;
  time: string;
  content: string;
  reactions: Record<ReactionKey, number>;
  reactedByMe: ReactionKey[];
};

type ChannelItem = {
  id: string;
  label: string;
  description: string;
  messageCount: number;
};

const MAIN_NAV = [
  { id: "panel-principal", label: "Panel Principal", icon: LayoutGrid },
  { id: "mis-alertas", label: "Mis Alertas", icon: Sparkles },
  { id: "resultados", label: "Resultados", icon: TrendingUp },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "gestion-capital", label: "Gestion de Capital", icon: Gauge },
  { id: "programa-fondeo", label: "Programa de Fondeo", icon: Rocket },
  { id: "comunidad", label: "Comunidad", icon: Users },
  { id: "historial", label: "Historial", icon: FolderClock },
  { id: "estadisticas", label: "Estadisticas", icon: ChartColumnBig },
] as const;

const CHANNELS: ChannelItem[] = [
  { id: "chat-principal", label: "chat-principal", description: "Canal principal para comunicacion general del equipo.", messageCount: 87 },
  { id: "alertas-en-vivo", label: "alertas-en-vivo", description: "Senales y alertas en tiempo real", messageCount: 56 },
  { id: "gestion-de-senales", label: "gestion-de-senales", description: "Analisis y gestion de operaciones", messageCount: 42 },
  { id: "dudas-de-miembros", label: "dudas-de-miembros", description: "Resolucion de dudas tacticas", messageCount: 23 },
  { id: "noticias-importantes", label: "noticias-importantes", description: "Comunicados clave", messageCount: 19 },
  { id: "resultados-operativos", label: "resultados-operativos", description: "Resumen de rendimiento", messageCount: 34 },
];

const CHANNEL_MESSAGES: Record<string, ChatMessage[]> = {
  "chat-principal": [
    {
      id: "cp-1",
      user: "Equipo CARVIPIX",
      role: "Equipo CARVIPIX",
      avatar: "EC",
      time: "09:02",
      content: "Buenos dias equipo, hoy estaremos atentos a XAUUSD y EURUSD durante sesion NY.",
      reactions: { like: 12, love: 4, fire: 5, check: 9, eyes: 6 },
      reactedByMe: [],
    },
    {
      id: "cp-2",
      user: "Maria",
      role: "Miembro PRO",
      avatar: "MA",
      time: "09:04",
      content: "La entrada de oro sigue valida?",
      reactions: { like: 8, love: 2, fire: 1, check: 0, eyes: 3 },
      reactedByMe: [],
    },
    {
      id: "cp-3",
      user: "Equipo CARVIPIX",
      role: "Equipo CARVIPIX",
      avatar: "EC",
      time: "09:05",
      content: "Si, mientras respete la zona de proteccion marcada.",
      reactions: { like: 8, love: 0, fire: 0, check: 4, eyes: 0 },
      reactedByMe: [],
    },
    {
      id: "cp-4",
      user: "Diego",
      role: "Miembro",
      avatar: "DI",
      time: "09:08",
      content: "Gracias, ya marque gestion parcial.",
      reactions: { like: 3, love: 0, fire: 0, check: 0, eyes: 0 },
      reactedByMe: [],
    },
    {
      id: "cp-5",
      user: "Lucio",
      role: "Miembro PRO",
      avatar: "LU",
      time: "09:12",
      content: "Reducire el tamano de lote para XAUUSD, mejor gestion de riesgo.",
      reactions: { like: 5, love: 0, fire: 2, check: 0, eyes: 1 },
      reactedByMe: [],
    },
    {
      id: "cp-6",
      user: "Sofia",
      role: "Miembro",
      avatar: "SO",
      time: "09:14",
      content: "He compartido una captura en #gestion-de-senales para revisar niveles.",
      reactions: { like: 4, love: 0, fire: 0, check: 2, eyes: 2 },
      reactedByMe: [],
    },
  ],
  "alertas-en-vivo": [
    {
      id: "al-1",
      user: "Moderador Alex",
      role: "Moderador",
      avatar: "AL",
      time: "10:03",
      content: "Alerta activa: EURUSD venta con confirmacion en M15.",
      reactions: { like: 7, love: 1, fire: 4, check: 5, eyes: 8 },
      reactedByMe: [],
    },
  ],
  "gestion-de-senales": [
    {
      id: "gs-1",
      user: "Equipo CARVIPIX",
      role: "Equipo CARVIPIX",
      avatar: "EC",
      time: "11:18",
      content: "Recordatorio: proteger parcial en +1R y mover SL a BE segun plan.",
      reactions: { like: 9, love: 0, fire: 3, check: 7, eyes: 4 },
      reactedByMe: [],
    },
  ],
  "dudas-de-miembros": [
    {
      id: "dm-1",
      user: "Carla",
      role: "Miembro",
      avatar: "CA",
      time: "12:01",
      content: "Que riesgo maximo diario recomiendan para cuenta de 10k?",
      reactions: { like: 2, love: 0, fire: 0, check: 0, eyes: 5 },
      reactedByMe: [],
    },
  ],
  "noticias-importantes": [
    {
      id: "ni-1",
      user: "Moderador Alex",
      role: "Moderador",
      avatar: "AL",
      time: "08:20",
      content: "Actualizacion de politicas internas de la comunidad disponible en anclados.",
      reactions: { like: 11, love: 0, fire: 1, check: 13, eyes: 7 },
      reactedByMe: [],
    },
  ],
  "resultados-operativos": [
    {
      id: "ro-1",
      user: "Equipo CARVIPIX",
      role: "Equipo CARVIPIX",
      avatar: "EC",
      time: "17:45",
      content: "Cierre del dia: win rate 68%, drawdown controlado y sesion cerrada en verde.",
      reactions: { like: 14, love: 6, fire: 9, check: 12, eyes: 4 },
      reactedByMe: [],
    },
  ],
};

const REACTION_META: Array<{ key: ReactionKey; emoji: string }> = [
  { key: "like", emoji: "👍" },
  { key: "love", emoji: "❤️" },
  { key: "fire", emoji: "🔥" },
  { key: "check", emoji: "✅" },
  { key: "eyes", emoji: "👀" },
];

function roleStyles(role: CommunityRole): string {
  if (role === "Equipo CARVIPIX") return "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#f0cb66]";
  if (role === "Moderador") return "bg-cyan-400/15 border-cyan-300/40 text-cyan-200";
  if (role === "Miembro PRO") return "bg-emerald-400/15 border-emerald-300/40 text-emerald-200";
  return "bg-white/10 border-white/20 text-white/80";
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ComunidadPage() {
  const [activeChannel, setActiveChannel] = useState<string>("chat-principal");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>(CHANNEL_MESSAGES);
  const [userName, setUserName] = useState("Miembro CARVIPIX");
  const [inputValue, setInputValue] = useState("");
  const [typingName, setTypingName] = useState("Andrea");
  const [helperNotice, setHelperNotice] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.nombre) {
          setUserName(user.nombre);
        }
      } catch {
        console.log("No se pudo cargar la identidad de comunidad");
      }
    };

    loadUser();
  }, []);

  const activeChannelInfo = useMemo(
    () => CHANNELS.find((channel) => channel.id === activeChannel) ?? CHANNELS[0],
    [activeChannel]
  );

  const activeMessages = messagesByChannel[activeChannel] ?? [];

  const onlineMembers = [
    { name: "Equipo CARVIPIX", role: "Equipo" },
    { name: "Maria", role: "Miembro PRO" },
    { name: "Diego", role: "Miembro" },
    { name: "Lucio", role: "Miembro PRO" },
    { name: "Sofia", role: "Miembro" },
  ];

  const toggleReaction = (messageId: string, reaction: ReactionKey) => {
    setMessagesByChannel((prev) => {
      const channelMessages = prev[activeChannel] ?? [];
      const updated = channelMessages.map((message) => {
        if (message.id !== messageId) return message;

        const alreadyReacted = message.reactedByMe.includes(reaction);
        return {
          ...message,
          reactions: {
            ...message.reactions,
            [reaction]: alreadyReacted
              ? Math.max(0, message.reactions[reaction] - 1)
              : message.reactions[reaction] + 1,
          },
          reactedByMe: alreadyReacted
            ? message.reactedByMe.filter((entry) => entry !== reaction)
            : [...message.reactedByMe, reaction],
        };
      });

      return {
        ...prev,
        [activeChannel]: updated,
      };
    });
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: userName,
      role: "Miembro PRO",
      avatar: userName.slice(0, 2).toUpperCase(),
      time: nowTime(),
      content: text,
      reactions: { like: 0, love: 0, fire: 0, check: 0, eyes: 0 },
      reactedByMe: [],
    };

    setMessagesByChannel((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] ?? []), newMessage],
    }));
    setInputValue("");
    setTypingName("Marco");
  };

  const addEmoji = () => {
    setInputValue((prev) => `${prev}${prev ? " " : ""}🔥`);
  };

  const attachFile = () => {
    setHelperNotice("Adjunto agregado al mensaje.");
    setTimeout(() => setHelperNotice(""), 2000);
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white px-2 py-3 md:px-3 md:py-4">
      <div className="mx-auto w-full max-w-[1480px] space-y-3">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] to-[#030303] p-3 md:p-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-[1.75rem] font-semibold">Comunidad CARVIPIX</h1>
            <p className="mt-1 text-xs md:text-sm text-white/65">Sala privada para seguimiento, dudas y acompanamiento operativo.</p>
            <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
              <CARVIPIXBadge variant="premium">Miembro PRO activo</CARVIPIXBadge>
              <CARVIPIXBadge variant="default">Comunidad moderada</CARVIPIXBadge>
              <CARVIPIXBadge variant="default">Canal privado</CARVIPIXBadge>
              <CARVIPIXBadge variant="success">Online ahora: 128</CARVIPIXBadge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <button type="button" className="h-8 w-8 rounded-lg border border-white/10 bg-[#0B0B0B] text-white/80 inline-flex items-center justify-center">
              <Search size={15} />
            </button>
            <button type="button" className="relative h-8 w-8 rounded-lg border border-white/10 bg-[#0B0B0B] text-white/80 inline-flex items-center justify-center">
              <Bell size={15} />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-[#D4AF37] text-black text-[10px] leading-none font-bold inline-flex items-center justify-center px-1">3</span>
            </button>
            <div className="rounded-xl border border-white/10 bg-[#0B0B0B] p-1.5 pr-2 flex items-center gap-2 min-w-0">
              <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#E7C866] to-[#D4AF37] text-black text-[11px] font-bold inline-flex items-center justify-center shrink-0">{userName.slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{userName}</p>
                <p className="text-[11px] text-white/60 truncate">Miembro PRO</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-2 md:gap-3 lg:grid-cols-[250px_minmax(0,1fr)_320px]">
          <aside className="space-y-2 md:space-y-3 lg:space-y-2 md:grid md:grid-cols-2 md:gap-3 lg:block">
            <CARVIPIXCard variant="info" padding="16">
              <h2 className="text-sm font-semibold">Panel de navegacion</h2>
              <nav className="mt-2 space-y-1.5">
                {MAIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === "comunidad";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs md:text-[13px] flex items-center gap-2 ${
                        isActive
                          ? "border-[#D4AF37]/55 bg-[#D4AF37]/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/80"
                      }`}
                    >
                      <span className="h-5 w-5 rounded-md bg-white/10 inline-flex items-center justify-center"><Icon size={14} /></span>
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </CARVIPIXCard>

            <CARVIPIXCard variant="premium" padding="16">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Canales</h3>
                <span className="text-[10px] tracking-[0.08em] uppercase text-white/55">Privados</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {CHANNELS.map((channel) => {
                  const isActive = channel.id === activeChannel;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => setActiveChannel(channel.id)}
                      className={`w-full rounded-lg border p-2 text-left ${
                        isActive
                          ? "border-[#D4AF37]/55 bg-[#D4AF37]/15"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-[13px] font-semibold inline-flex items-center gap-1">
                          <Hash size={12} />
                          {channel.label}
                        </span>
                        <small className="text-[10px] text-white/60">{channel.messageCount}</small>
                      </div>
                      <p className="mt-1 text-[11px] text-white/60">{channel.description}</p>
                    </button>
                  );
                })}
              </div>
            </CARVIPIXCard>
          </aside>

          <section className="min-w-0">
            <CARVIPIXCard variant="premium" padding="16">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="min-w-0">
                  <h2 className="text-sm md:text-base font-semibold truncate">#{activeChannelInfo.label}</h2>
                  <p className="mt-1 text-[11px] md:text-xs text-white/60">{activeChannelInfo.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" className="h-8 w-8 rounded-lg border border-white/10 bg-[#0B0B0B] inline-flex items-center justify-center text-white/80"><Bell size={14} /></button>
                  <button type="button" className="h-8 w-8 rounded-lg border border-white/10 bg-[#0B0B0B] inline-flex items-center justify-center text-white/80"><Search size={14} /></button>
                  <button type="button" className="h-8 w-8 rounded-lg border border-white/10 bg-[#0B0B0B] inline-flex items-center justify-center text-white/80"><Users size={14} /></button>
                </div>
              </div>

              <div className="mt-2.5 h-[44vh] min-h-[260px] md:h-[52vh] overflow-auto pr-1 space-y-2">
                {activeMessages.map((message) => (
                  <article key={message.id} className="rounded-xl border border-white/10 bg-[#0A111B] p-2.5 md:p-3 grid grid-cols-[34px_minmax(0,1fr)] gap-2">
                    <div className="h-[34px] w-[34px] rounded-full border border-white/20 bg-gradient-to-br from-[#D4AF37]/70 to-[#2C4A7A] text-[11px] font-bold inline-flex items-center justify-center">
                      {message.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="text-xs md:text-sm font-semibold">{message.user}</strong>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${roleStyles(message.role)}`}>{message.role}</span>
                        <small className="text-[10px] text-white/55">{message.time}</small>
                      </div>
                      <p className="mt-1.5 text-xs md:text-sm leading-relaxed text-white/90">{message.content}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {REACTION_META.map((reaction) => {
                          const isActive = message.reactedByMe.includes(reaction.key);
                          return (
                            <button
                              key={reaction.key}
                              type="button"
                              onClick={() => toggleReaction(message.id, reaction.key)}
                              className={`rounded-full border px-2 py-1 text-xs inline-flex items-center gap-1 ${
                                isActive
                                  ? "border-[#D4AF37]/55 bg-[#D4AF37]/15"
                                  : "border-white/15 bg-white/[0.03]"
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <small className="text-[10px] text-white/75">{message.reactions[reaction.key]}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <p className="mt-2 text-[11px] md:text-xs text-white/55">{typingName} esta escribiendo...</p>

              <div className="mt-2 rounded-xl border border-white/12 bg-[#070E17] p-1.5 grid grid-cols-[34px_34px_minmax(0,1fr)] md:grid-cols-[34px_34px_minmax(0,1fr)_auto] gap-1.5 items-center">
                <button type="button" onClick={attachFile} className="h-[34px] w-[34px] rounded-lg border border-white/12 bg-[#0B0B0B] text-white/80 inline-flex items-center justify-center">
                  <Paperclip size={15} />
                </button>
                <button type="button" onClick={addEmoji} className="h-[34px] w-[34px] rounded-lg border border-white/12 bg-[#0B0B0B] text-white/80 inline-flex items-center justify-center">
                  <Heart size={15} />
                </button>
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendMessage();
                  }}
                  placeholder="Escribe tu mensaje..."
                  className="h-[34px] min-w-0 w-full rounded-lg border border-white/15 bg-[#0A111B] px-3 text-xs md:text-sm text-white placeholder:text-white/45 outline-none"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="h-[34px] rounded-lg bg-gradient-to-r from-[#F0CF68] to-[#D4AF37] text-black font-bold px-3 text-xs inline-flex items-center justify-center gap-1 md:col-auto col-span-full"
                >
                  <Send size={14} />
                  Enviar
                </button>
              </div>
              {helperNotice ? <p className="mt-1.5 text-[11px] text-white/60">{helperNotice}</p> : null}
            </CARVIPIXCard>
          </section>

          <aside className="space-y-2 md:space-y-3">
            <CARVIPIXCard variant="info" padding="16">
              <h3 className="text-sm font-semibold">Reglas de la comunidad</h3>
              <ul className="mt-2 space-y-1.5 text-xs md:text-[13px] text-white/85">
                <li className="flex items-center gap-1.5"><Shield size={13} /> Respeto.</li>
                <li className="flex items-center gap-1.5"><CircleHelp size={13} /> No spam.</li>
                <li className="flex items-center gap-1.5"><Gem size={13} /> No prometer ganancias.</li>
                <li className="flex items-center gap-1.5"><Users size={13} /> Seguir instrucciones.</li>
              </ul>
            </CARVIPIXCard>

            <CARVIPIXCard variant="info" padding="16">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Canales activos</h3>
                <span className="text-[10px] uppercase tracking-[0.08em] text-white/55">Ver todos</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {CHANNELS.map((channel) => (
                  <div key={`active-${channel.id}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="text-xs md:text-[13px] block truncate">#{channel.label}</strong>
                      <p className="mt-1 text-[11px] text-white/60 line-clamp-2">{channel.description}</p>
                    </div>
                    <span className="text-[11px] text-white/60 shrink-0">{channel.messageCount}</span>
                  </div>
                ))}
              </div>
            </CARVIPIXCard>

            <CARVIPIXCard variant="info" padding="16">
              <h3 className="text-sm font-semibold">Estado de sala</h3>
              <div className="mt-2 space-y-1.5 text-xs md:text-[13px]">
                <p className="flex items-center justify-between gap-2"><span className="text-white/60">Moderadores</span><strong>3</strong></p>
                <p className="flex items-center justify-between gap-2"><span className="text-white/60">Miembros online</span><strong>128</strong></p>
                <p className="flex items-center justify-between gap-2"><span className="text-white/60">Total de miembros</span><strong>1,248</strong></p>
                <p className="flex items-center justify-between gap-2"><span className="text-white/60">Ultima actualizacion</span><strong>hace 2 min</strong></p>
              </div>
            </CARVIPIXCard>

            <CARVIPIXCard variant="premium" padding="16">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Miembros activos</h3>
                <span className="text-[10px] uppercase tracking-[0.08em] text-white/55">Ver todos</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {onlineMembers.map((member) => (
                  <div key={member.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 grid grid-cols-[28px_minmax(0,1fr)_8px] gap-2 items-center">
                    <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#7C9BE0] text-black text-[11px] font-bold inline-flex items-center justify-center">{member.name.slice(0, 2).toUpperCase()}</span>
                    <div className="min-w-0">
                      <strong className="text-xs md:text-[13px] block truncate">{member.name}</strong>
                      <p className="text-[11px] text-white/60 truncate">{member.role}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]" />
                  </div>
                ))}
              </div>
            </CARVIPIXCard>
          </aside>
        </section>
      </div>
    </main>
  );
}
