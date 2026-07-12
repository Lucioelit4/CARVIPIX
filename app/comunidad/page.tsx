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
  Flag,
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
import DataSourceBanner from "@/app/components/DataSourceBanner";

type CommunityRole = "Equipo CARVIPIX" | "Moderador" | "Miembro PRO" | "Miembro BASIC" | "Miembro";
type ReactionKey = "like" | "love" | "fire" | "check" | "eyes";

type ChatMessage = {
  id: string;
  userId?: string;
  user: string;
  role: CommunityRole;
  avatar: string;
  time: string;
  content: string;
  parentMessageId?: string | null;
  mentions?: string[];
  readBy?: string[];
  editedAt?: string | null;
  deletedAt?: string | null;
  isPinned?: boolean;
  pinnedBy?: string | null;
  reactions: Record<ReactionKey, number>;
  reactedByMe: ReactionKey[];
};

type ChannelItem = {
  id: string;
  label: string;
  description: string;
  messageCount: number;
};

type ModerationLog = {
  id: string;
  action: string;
  reason: string;
  createdAt: string;
};

type CommunityProfile = {
  isAdmin: boolean;
  plan: "free" | "basic" | "advanced";
  hasBot: boolean;
  hasCapital: boolean;
  membershipActive: boolean;
};

const MAIN_NAV = [
  { id: "panel-principal", label: "Panel Principal", icon: LayoutGrid },
  { id: "mis-alertas", label: "Mis Alertas", icon: Sparkles },
  { id: "resultados", label: "Resultados", icon: TrendingUp },
  { id: "bot", label: "Bot", icon: Bot },
  { id: "gestion-capital", label: "Gestion de Capital", icon: Gauge },
  { id: "cuentas-fondeadas", label: "Cuentas Fondeadas", icon: Rocket },
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
  if (role === "Miembro BASIC") return "bg-blue-400/15 border-blue-300/40 text-blue-200";
  return "bg-white/10 border-white/20 text-white/80";
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ComunidadPage() {
  const [activeChannel, setActiveChannel] = useState<string>("chat-principal");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>(CHANNEL_MESSAGES);
  const [availableChannels, setAvailableChannels] = useState<string[]>(CHANNELS.map((channel) => channel.id));
  const [userName, setUserName] = useState("Miembro CARVIPIX");
  const [inputValue, setInputValue] = useState("");
  const [typingName, setTypingName] = useState("Andrea");
  const [helperNotice, setHelperNotice] = useState("");
  const [moderationNotice, setModerationNotice] = useState("");
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userName: string; userId: string }>>([]);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [syncingChannel, setSyncingChannel] = useState(false);

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

  useEffect(() => {
    const loadChannel = async () => {
      setSyncingChannel(true);
      try {
        const response = await fetch(`/api/client/community/chat?channel=${encodeURIComponent(activeChannel)}`, { cache: "no-store" });
        if (!response.ok) {
          if (response.status === 401) {
            setModerationNotice("Inicia sesion para sincronizar chat de miembros en linea.");
          }
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as {
          data?: {
            messages?: Array<{
              id: string;
              userId?: string;
              userName: string;
              role: string;
              content: string;
              parentMessageId?: string | null;
              mentions?: string[];
              readBy?: string[];
              editedAt?: string | null;
              deletedAt?: string | null;
              isPinned?: boolean;
              pinnedBy?: string | null;
              createdAt: string;
            }>;
            moderationLogs?: ModerationLog[];
            quickReplies?: string[];
            typingUsers?: Array<{ userName: string; userId: string }>;
            connectedUsers?: number;
            availableChannels?: string[];
            profile?: CommunityProfile;
            sanction?: { active: boolean; reason?: string; type?: string };
          };
        };

        const messages = (payload.data?.messages ?? []).map((item) => ({
          id: item.id,
          userId: item.userId,
          user: item.userName,
          role: (["Equipo CARVIPIX", "Moderador", "Miembro PRO", "Miembro BASIC", "Miembro"] as const).includes(item.role as CommunityRole)
            ? (item.role as CommunityRole)
            : "Miembro",
          avatar: item.userName.slice(0, 2).toUpperCase(),
          time: new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: item.content,
          parentMessageId: item.parentMessageId,
          mentions: item.mentions ?? [],
          readBy: item.readBy ?? [],
          editedAt: item.editedAt ?? null,
          deletedAt: item.deletedAt ?? null,
          isPinned: item.isPinned ?? false,
          pinnedBy: item.pinnedBy ?? null,
          reactions: { like: 0, love: 0, fire: 0, check: 0, eyes: 0 },
          reactedByMe: [],
        }));

        if (messages.length > 0) {
          setMessagesByChannel((prev) => ({
            ...prev,
            [activeChannel]: messages,
          }));
        }

        setModerationLogs(payload.data?.moderationLogs ?? []);
        setQuickReplies(payload.data?.quickReplies ?? []);
        setTypingUsers(payload.data?.typingUsers ?? []);
        setConnectedUsers(Number(payload.data?.connectedUsers ?? 0));
        if (Array.isArray(payload.data?.availableChannels) && payload.data?.availableChannels.length > 0) {
          setAvailableChannels(payload.data?.availableChannels);
        }
        setProfile(payload.data?.profile ?? null);

        if (payload.data?.sanction?.active) {
          setModerationNotice(`Sancion activa (${payload.data.sanction.type ?? "moderacion"}): ${payload.data.sanction.reason ?? "Sin detalle"}`);
        }
      } catch {
        setModerationNotice("No se pudo sincronizar el chat en este momento.");
      } finally {
        setSyncingChannel(false);
      }
    };

    void loadChannel();

    const pollId = window.setInterval(() => {
      void loadChannel();
    }, 7000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [activeChannel]);

  useEffect(() => {
    if (!inputValue.trim()) {
      return;
    }

    const typingId = window.setTimeout(() => {
      void fetch("/api/client/community/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "typing", channelId: activeChannel }),
      });
    }, 250);

    return () => {
      window.clearTimeout(typingId);
    };
  }, [inputValue, activeChannel]);

  const activeChannelInfo = useMemo(
    () => CHANNELS.find((channel) => channel.id === activeChannel) ?? CHANNELS[0],
    [activeChannel]
  );

  const visibleChannels = CHANNELS.filter((channel) => availableChannels.includes(channel.id));
  const activeMessages = messagesByChannel[activeChannel] ?? [];
  const pinnedMessages = activeMessages.filter((message) => message.isPinned && !message.deletedAt);
  const orderedMessages = [...activeMessages].sort((a, b) => {
    if (Boolean(a.isPinned) === Boolean(b.isPinned)) return 0;
    return a.isPinned ? -1 : 1;
  });

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

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    try {
      if (editingMessageId) {
        const editResponse = await fetch("/api/client/community/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "edit", channelId: activeChannel, messageId: editingMessageId, message: text }),
        });

        if (!editResponse.ok) {
          const payload = (await editResponse.json().catch(() => ({}))) as { error?: string };
          setModerationNotice(payload.error || "No se pudo editar el mensaje.");
          return;
        }

        setMessagesByChannel((prev) => ({
          ...prev,
          [activeChannel]: (prev[activeChannel] ?? []).map((item) =>
            item.id === editingMessageId ? { ...item, content: text, editedAt: new Date().toISOString() } : item
          ),
        }));
        setEditingMessageId(null);
        setInputValue("");
        return;
      }

      const response = await fetch("/api/client/community/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannel,
          message: text,
          parentMessageId: replyTo?.id ?? null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: {
          id?: string;
          userId?: string;
          userName?: string;
          role?: string;
          content?: string;
          createdAt?: string;
          parentMessageId?: string | null;
          mentions?: string[];
        };
        error?: string;
      };

      if (!response.ok) {
        setModerationNotice(payload.error || "No se pudo enviar el mensaje.");
        setTimeout(() => setModerationNotice(""), 3000);
        return;
      }

      const newMessage: ChatMessage = {
        id: payload.data?.id ?? `msg-${Date.now()}`,
        userId: payload.data?.userId,
        user: payload.data?.userName ?? userName,
        role: (["Equipo CARVIPIX", "Moderador", "Miembro PRO", "Miembro BASIC", "Miembro"] as const).includes((payload.data?.role ?? "Miembro") as CommunityRole)
          ? (payload.data?.role as CommunityRole)
          : "Miembro",
        avatar: (payload.data?.userName ?? userName).slice(0, 2).toUpperCase(),
        time: payload.data?.createdAt ? new Date(payload.data.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : nowTime(),
        content: payload.data?.content ?? text,
        parentMessageId: payload.data?.parentMessageId ?? null,
        mentions: payload.data?.mentions ?? [],
        readBy: payload.data?.userId ? [payload.data?.userId] : [],
        editedAt: null,
        deletedAt: null,
        isPinned: false,
        pinnedBy: null,
        reactions: { like: 0, love: 0, fire: 0, check: 0, eyes: 0 },
        reactedByMe: [],
      };

      setMessagesByChannel((prev) => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] ?? []), newMessage],
      }));
      setInputValue("");
      setReplyTo(null);
      setTypingName("Marco");
    } catch {
      setModerationNotice("No se pudo enviar el mensaje en este momento.");
      setTimeout(() => setModerationNotice(""), 3000);
    }
  };

  const reportMessage = async (messageId: string) => {
    try {
      const response = await fetch("/api/client/community/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "report",
          channelId: activeChannel,
          messageId,
          reason: "Reporte desde interfaz de comunidad",
        }),
      });

      if (!response.ok) {
        setModerationNotice("No se pudo reportar el mensaje.");
        return;
      }

      setModerationNotice("Mensaje reportado a moderacion.");
      setTimeout(() => setModerationNotice(""), 2500);
    } catch {
      setModerationNotice("No se pudo reportar el mensaje.");
    }
  };

  const markAsRead = async (messageId: string) => {
    await fetch("/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "read", channelId: activeChannel, messageId }),
    }).catch(() => null);
  };

  const deleteMessage = async (messageId: string) => {
    const response = await fetch("/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", channelId: activeChannel, messageId }),
    }).catch(() => null);

    if (!response?.ok) {
      setModerationNotice("No se pudo eliminar el mensaje.");
      return;
    }

    setMessagesByChannel((prev) => ({
      ...prev,
      [activeChannel]: (prev[activeChannel] ?? []).map((item) =>
        item.id === messageId ? { ...item, content: "[Mensaje eliminado]", deletedAt: new Date().toISOString() } : item
      ),
    }));
  };

  const togglePin = async (messageId: string, pin: boolean) => {
    const response = await fetch("/api/client/community/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "pin", channelId: activeChannel, messageId, pin }),
    }).catch(() => null);

    if (!response?.ok) {
      setModerationNotice("Solo administradores pueden anclar mensajes.");
      return;
    }

    setMessagesByChannel((prev) => ({
      ...prev,
      [activeChannel]: (prev[activeChannel] ?? []).map((item) =>
        item.id === messageId ? { ...item, isPinned: pin, pinnedBy: pin ? "admin" : null } : item
      ),
    }));
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
        <DataSourceBanner />
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
                {visibleChannels.map((channel) => {
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

              {pinnedMessages.length > 0 ? (
                <div className="mt-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#D4AF37]">Mensajes anclados</p>
                  <div className="mt-1.5 space-y-1.5">
                    {pinnedMessages.slice(0, 2).map((message) => (
                      <div key={`pinned-${message.id}`} className="rounded-lg border border-white/15 bg-[#0A111B] p-2">
                        <p className="text-[11px] text-white/70">{message.user}</p>
                        <p className="mt-1 text-xs text-white/90 line-clamp-2">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-2.5 h-[44vh] min-h-[260px] md:h-[52vh] overflow-auto pr-1 space-y-2">
                {orderedMessages.map((message) => (
                  <article key={message.id} className="rounded-xl border border-white/10 bg-[#0A111B] p-2.5 md:p-3 grid grid-cols-[34px_minmax(0,1fr)] gap-2">
                    <div className="h-[34px] w-[34px] rounded-full border border-white/20 bg-gradient-to-br from-[#D4AF37]/70 to-[#2C4A7A] text-[11px] font-bold inline-flex items-center justify-center">
                      {message.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="text-xs md:text-sm font-semibold">{message.user}</strong>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${roleStyles(message.role)}`}>{message.role}</span>
                        <small className="text-[10px] text-white/55">{message.time}</small>
                        {message.editedAt ? <small className="text-[10px] text-white/45">editado</small> : null}
                        {message.isPinned ? <small className="text-[10px] text-[#D4AF37]">anclado</small> : null}
                        <button
                          type="button"
                          onClick={() => void reportMessage(message.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                        >
                          <Flag size={10} />
                          Reportar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(message);
                            setInputValue(`@${message.user.split(" ")[0]} `);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                        >
                          Responder
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setInputValue(message.content);
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteMessage(message.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                        >
                          Eliminar
                        </button>
                        {profile?.isAdmin ? (
                          <button
                            type="button"
                            onClick={() => void togglePin(message.id, !message.isPinned)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                          >
                            {message.isPinned ? "Desanclar" : "Anclar"}
                          </button>
                        ) : null}
                      </div>
                      {message.parentMessageId ? (
                        <p className="mt-1 text-[11px] text-white/55">Respuesta en hilo #{message.parentMessageId.slice(0, 6)}</p>
                      ) : null}
                      <p className="mt-1.5 text-xs md:text-sm leading-relaxed text-white/90">{message.content}</p>
                      {message.readBy && message.readBy.length > 0 ? (
                        <p className="mt-1 text-[10px] text-white/50">Leido por {message.readBy.length} miembro(s)</p>
                      ) : null}

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
                        <button
                          type="button"
                          onClick={() => void markAsRead(message.id)}
                          className="rounded-full border border-white/15 px-2 py-1 text-xs inline-flex items-center gap-1 bg-white/[0.03]"
                        >
                          <span>👁️</span>
                          <small className="text-[10px] text-white/75">Marcar leido</small>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <p className="mt-2 text-[11px] md:text-xs text-white/55">
                {typingUsers.length > 0
                  ? `${typingUsers.map((user) => user.userName).slice(0, 2).join(", ")} esta escribiendo...`
                  : `${typingName} esta escribiendo...`}
              </p>

              {quickReplies.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {quickReplies.slice(0, 3).map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setInputValue(reply)}
                      className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-white/80 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}

              {replyTo ? (
                <div className="mt-1.5 rounded-lg border border-white/12 bg-white/[0.03] p-2 text-[11px] text-white/70">
                  Respondiendo a {replyTo.user}: &quot;{replyTo.content.slice(0, 80)}&quot;
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="ml-2 text-[#D4AF37]"
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}

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
                    if (event.key === "Enter") {
                      void sendMessage();
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  className="h-[34px] min-w-0 w-full rounded-lg border border-white/15 bg-[#0A111B] px-3 text-xs md:text-sm text-white placeholder:text-white/45 outline-none"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  className="h-[34px] rounded-lg bg-gradient-to-r from-[#F0CF68] to-[#D4AF37] text-black font-bold px-3 text-xs inline-flex items-center justify-center gap-1 md:col-auto col-span-full"
                >
                  <Send size={14} />
                  {editingMessageId ? "Guardar" : "Enviar"}
                </button>
              </div>
              {helperNotice ? <p className="mt-1.5 text-[11px] text-white/60">{helperNotice}</p> : null}
              {syncingChannel ? <p className="mt-1.5 text-[11px] text-white/60">Sincronizando canal...</p> : null}
              {moderationNotice ? <p className="mt-1.5 text-[11px] text-[#D4AF37]">{moderationNotice}</p> : null}
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
                {visibleChannels.map((channel) => (
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
                <p className="flex items-center justify-between gap-2"><span className="text-white/60">Miembros online</span><strong>{connectedUsers || 0}</strong></p>
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

            <CARVIPIXCard variant="info" padding="16">
              <h3 className="text-sm font-semibold">Registro de moderacion</h3>
              <div className="mt-2 space-y-1.5">
                {moderationLogs.length === 0 ? (
                  <p className="text-[11px] text-white/55">Sin eventos recientes en este canal.</p>
                ) : (
                  moderationLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                      <p className="text-[11px] text-[#D4AF37] uppercase">{log.action}</p>
                      <p className="text-[11px] text-white/75 mt-1">{log.reason}</p>
                      <p className="text-[10px] text-white/50 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </CARVIPIXCard>
          </aside>
        </section>
      </div>
    </main>
  );
}
