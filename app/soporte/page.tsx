'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Send,
  MessageCircle,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bot,
  Ticket,
  Radio,
} from 'lucide-react';
import { getDailyBriefing, getTradingSuggestions } from '@/app/lib/client-data-helpers';
import { validateTicketForm } from '@/app/lib/form-validators';
import DisclaimerNote from '@/app/components/DisclaimerNote';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category:
    | 'empresa'
    | 'alertas'
    | 'bot'
    | 'membresias'
    | 'pagos'
    | 'facturacion'
    | 'socios-estrategicos'
    | 'fondeo'
    | 'resultados'
    | 'comunidad'
    | 'soporte'
    | 'problemas-tecnicos'
    | 'cuenta'
    | 'seguridad'
    | 'legal'
    | 'administracion';
  popularity?: number;
};

type SessionPayload = {
  authenticated?: boolean;
};

export default function SoportePage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [sendingAi, setSendingAi] = useState(false);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [faqTopItems, setFaqTopItems] = useState<FaqItem[]>([]);
  const [faqRelatedItems, setFaqRelatedItems] = useState<FaqItem[]>([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<'all' | FaqItem['category']>('all');
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hola, soy el asistente CARVIPIX. Puedo ayudarte con alertas, membresia, bot, socios estrategicos, fondeo o soporte tecnico.',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [ticketForm, setTicketForm] = useState({
    categoria: 'Alertas',
    prioridad: 'Normal',
    mensaje: '',
  });
  const [ticketErrors, setTicketErrors] = useState<{ [key: string]: string }>({});
  const [ticketMessage, setTicketMessage] = useState('');
  const [agentNotice, setAgentNotice] = useState('');
  const [lastFaqFocusId, setLastFaqFocusId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FAQ_CATEGORY_LABELS: Record<'all' | FaqItem['category'], string> = {
    all: 'Todas',
    empresa: 'Empresa',
    alertas: 'Alertas',
    bot: 'Bot',
    membresias: 'Membresias',
    pagos: 'Pagos',
    facturacion: 'Facturacion',
    'socios-estrategicos': 'Socios Estrategicos',
    fondeo: 'Fondeo',
    resultados: 'Resultados',
    comunidad: 'Comunidad',
    soporte: 'Soporte',
    'problemas-tecnicos': 'Problemas Tecnicos',
    cuenta: 'Cuenta',
    seguridad: 'Seguridad',
    legal: 'Legal',
    administracion: 'Administracion',
  };

  // Load AI support data from modules on mount
  useEffect(() => {
    const loadAIData = async () => {
      try {
        const storedConversationId = window.localStorage.getItem('carvipix-support-conversation-id') || '';
        if (storedConversationId) {
          setConversationId(storedConversationId);
        }

        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' }).catch(() => null);
        if (sessionResponse?.ok) {
          const sessionPayload = (await sessionResponse.json().catch(() => ({}))) as SessionPayload;
          setSession(sessionPayload);
        } else {
          setSession({ authenticated: false });
        }

        const faqResponse = await fetch('/api/client/support/intelligence', { cache: 'no-store' }).catch(() => null);
        if (faqResponse?.ok) {
          const faqPayload = (await faqResponse.json().catch(() => ({}))) as {
            data?: {
              faq?: FaqItem[];
              top?: FaqItem[];
            };
          };
          setFaqItems(Array.isArray(faqPayload.data?.faq) ? faqPayload.data?.faq : []);
          setFaqTopItems(Array.isArray(faqPayload.data?.top) ? faqPayload.data?.top : []);
        }

        const briefing = await getDailyBriefing();
        await getTradingSuggestions();
        
        if (briefing) {
          // Agregar briefing como mensaje inicial del asistente
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Briefing del dia:\n${briefing.content.substring(0, 200)}...`,
            },
          ]);
        }
      } catch {
        console.log("No se pudo cargar el contexto inicial de soporte");
      }
    };

    loadAIData();
  }, []);

  useEffect(() => {
    const fetchFaq = async () => {
      const params = new URLSearchParams();
      if (faqSearch.trim()) params.set('q', faqSearch.trim());
      if (faqCategory !== 'all') params.set('category', faqCategory);
      if (lastFaqFocusId) params.set('relatedTo', lastFaqFocusId);

      const response = await fetch(`/api/client/support/faq?${params.toString()}`, { cache: 'no-store' }).catch(() => null);
      if (!response?.ok) return;

      const payload = (await response.json().catch(() => ({}))) as { data?: FaqItem[]; related?: FaqItem[] };
      setFaqItems(Array.isArray(payload.data) ? payload.data : []);
      setFaqRelatedItems(Array.isArray(payload.related) ? payload.related : []);
    };

    void fetchFaq();
  }, [faqSearch, faqCategory, lastFaqFocusId]);

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje en el chat
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const rawInput = inputValue;
    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setSendingAi(true);
    setAgentNotice('');

    try {
      const response = await fetch('/api/client/support/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawInput, conversationId: conversationId || undefined }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: {
          conversationId?: string;
          answer?: string;
          escalated?: boolean;
          escalationTicketId?: string | null;
          category?: string;
        };
      };

      if (payload.data?.conversationId) {
        setConversationId(payload.data.conversationId);
        window.localStorage.setItem('carvipix-support-conversation-id', payload.data.conversationId);
      }

      if (response.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${String(payload.data?.answer ?? 'Puedo responder con informacion oficial, pero para escalar el caso automaticamente debes iniciar sesion.')}\n\n${String(payload.error ?? 'Inicia sesion para permitir escalamiento por ticket.')}`,
          },
        ]);
        return;
      }

      const answer = String(payload.data?.answer ?? '').trim() || 'No pude procesar la consulta en este momento.';
      const escalated = Boolean(payload.data?.escalated);
      const escalationTicketId = payload.data?.escalationTicketId ?? null;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: escalated && escalationTicketId
            ? `${answer}\n\nHe escalado el caso automaticamente. Ticket: ${escalationTicketId}`
            : answer,
        },
      ]);

      if (escalated && escalationTicketId) {
        setAgentNotice(`Caso escalado a administracion con ticket ${escalationTicketId}.`);
      }

      if (payload.data?.category) {
        const matchingFaq = faqItems.find((item) => item.category === payload.data?.category);
        if (matchingFaq) {
          setLastFaqFocusId(matchingFaq.id);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No pude conectar con el agente inteligente en este momento. Si tu caso es urgente, crea un ticket.',
        },
      ]);
    } finally {
      setSendingAi(false);
    }
  };

  // Cargar tema rapido
  const handleQuickTopic = (topic: string) => {
    const questionMap: { [key: string]: string } = {
      'Alertas en Vivo': 'Como funcionan las alertas en vivo?',
      'Membresia': 'Que incluye el plan CARVIPIX PRO?',
      'Bot CARVIPIX': 'Como funciona el Bot de automatizacion?',
      'Socios Estrategicos': 'Como envio una solicitud de evaluacion para socios estrategicos?',
      'Fondeo': 'Como funciona el servicio de fondeo?',
      'Problemas tecnicos': 'Que hago si tengo un problema tecnico?',
    };

    const question = questionMap[topic] || topic;
    setInputValue(question);
    setTimeout(() => {
      void handleSendMessage();
    }, 100);
  };

  // Crear ticket
  const handleCreateTicket = async () => {
    const validationErrors = validateTicketForm(ticketForm);
    
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as { [key: string]: string });
      setTicketErrors(errorMap);
      return;
    }

    if (!session?.authenticated) {
      setTicketMessage('Debes iniciar sesion para crear un ticket privado.');
      return;
    }

    setTicketErrors({});
    setCreatingTicket(true);

    try {
      const priorityMap: Record<string, string> = {
        Baja: 'low',
        Normal: 'medium',
        Alta: 'high',
        Urgente: 'high',
      };

      const response = await fetch('/api/client/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Soporte ${ticketForm.categoria}`,
          category: ticketForm.categoria.toLowerCase(),
          priority: priorityMap[ticketForm.prioridad] ?? 'medium',
          message: ticketForm.mensaje,
          conversation: messages.slice(-10).map((item) => ({ role: item.role, content: item.content })),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.id) {
        throw new Error(payload.error || 'No se pudo crear el ticket.');
      }

      setTicketMessage(`Ticket creado correctamente. ID: ${payload.id}`);
      setTicketForm({ categoria: 'Alertas', prioridad: 'Normal', mensaje: '' });
      setTimeout(() => setTicketMessage(''), 4000);
    } catch (error) {
      setTicketMessage(error instanceof Error ? error.message : 'No se pudo crear el ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // Manejo de Enter en input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#0B0B0B] to-[#030303] border-b border-white/5 px-4 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4"
          >
            Soporte CARVIPIX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-white/80 mb-8"
          >
            Asistencia privada para miembros, dudas operativas, pagos, membresias y navegacion dentro de la plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {[
              'Asistente IA CARVIPIX',
              'Respuesta 24/7',
              'Tickets privados',
              'Soporte premium',
            ].map((badge, i) => (
              <span
                key={i}
                className="bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-medium border border-[#D4AF37]/30"
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Card Destacada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#D4AF37]/10 to-[#0B0B0B] border border-[#D4AF37]/30 rounded-2xl p-6 mb-12 flex items-center gap-6"
        >
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Asistente CARVIPIX</h3>
            <p className="text-[#D4AF37] font-semibold mb-1">Disponible 24/7</p>
            <p className="text-sm text-white/60 mb-2">
              {session?.authenticated ? 'Puedes abrir tickets privados con tu sesion activa.' : 'Puedes consultar informacion publica aqui. Para abrir tickets privados necesitas iniciar sesion.'}
            </p>
            <div className="mt-2">
              <DisclaimerNote variant="support" />
            </div>
          </div>
        </motion.div>

        {/* Chat y Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Chat Principal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-[#0B0B0B] border border-white/10 rounded-2xl p-6 flex flex-col h-[600px]"
          >
            <div className="mb-6 pb-6 border-b border-white/10">
              <h2 className="text-2xl font-bold mb-1">Asistente CARVIPIX</h2>
              <p className="text-sm text-white/60">
                Pregunta sobre tu cuenta, alertas, bot, membresia o servicios.
              </p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#D4AF37] text-[#030303] rounded-br-none'
                        : 'bg-[#1a2535] text-white border border-white/10 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#D4AF37] outline-none transition-colors"
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={sendingAi}
                className="bg-[#D4AF37] text-[#030303] p-3 rounded-lg hover:bg-[#E5C158] transition-all font-bold disabled:opacity-60"
              >
                <Send size={20} />
              </button>
            </div>
            {sendingAi ? <p className="mt-2 text-xs text-white/60">Analizando consulta con base oficial CARVIPIX...</p> : null}
            {agentNotice ? <p className="mt-2 text-xs text-[#D4AF37]">{agentNotice}</p> : null}
            {conversationId ? <p className="mt-1 text-[11px] text-white/50">Sesion de soporte: {conversationId}</p> : null}
          </motion.div>

          {/* Sidebar - Temas Rapidos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
                Temas rapidos
              </h3>

              <div className="space-y-2">
                {[
                  'Alertas en Vivo',
                  'Membresia',
                  'Bot CARVIPIX',
                  'Socios Estrategicos',
                  'Fondeo',
                  'Problemas tecnicos',
                ].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleQuickTopic(topic)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 transition-all text-sm font-medium text-white/80 hover:text-[#D4AF37]"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Radio className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              value={faqSearch}
              onChange={(event) => setFaqSearch(event.target.value)}
              placeholder="Buscar pregunta..."
              className="lg:col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:border-[#D4AF37] outline-none"
            />
            <select
              value={faqCategory}
              onChange={(event) => setFaqCategory(event.target.value as 'all' | FaqItem['category'])}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none"
            >
              {Object.entries(FAQ_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {faqTopItems.length > 0 ? (
            <div className="mb-6">
              <p className="text-sm text-white/70 mb-3">Mas consultadas</p>
              <div className="flex flex-wrap gap-2">
                {faqTopItems.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLastFaqFocusId(item.id)}
                    className="px-3 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-xs"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqItems.map((faq) => (
              <button
                key={faq.id}
                onClick={() => setLastFaqFocusId(faq.id)}
                className="text-left rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#D4AF37]/30 transition-colors"
              >
                <p className="text-xs uppercase tracking-wide text-[#D4AF37] mb-2">{FAQ_CATEGORY_LABELS[faq.category]}</p>
                <h3 className="text-sm font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{faq.answer}</p>
              </button>
            ))}
          </div>

          {faqRelatedItems.length > 0 ? (
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-sm text-white/70 mb-3">Preguntas relacionadas</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {faqRelatedItems.slice(0, 6).map((item) => (
                  <button
                    key={`related-${item.id}`}
                    onClick={() => setLastFaqFocusId(item.id)}
                    className="text-left rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-[#D4AF37]/30 transition-colors"
                  >
                    <p className="text-xs text-[#D4AF37] uppercase mb-1">{FAQ_CATEGORY_LABELS[item.category]}</p>
                    <p className="text-sm text-white">{item.question}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Crear Ticket Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0B0B0B] border border-white/10 rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-2xl font-bold">Crear Ticket</h2>
          </div>

          {ticketMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg p-3 mb-6 text-sm flex items-center gap-2 ${ticketMessage.startsWith('Ticket creado correctamente') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'}`}
            >
              <CheckCircle2 size={16} />
              {ticketMessage}
            </motion.div>
          )}

          {!session?.authenticated && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-6 text-sm text-white/70">
              Para crear un ticket privado debes iniciar sesion con tu cuenta CARVIPIX. Si aun no tienes acceso, puedes escribir a <span className="text-[#D4AF37]">soporte@carvipix.com</span> o <Link href="/login" className="text-[#D4AF37] underline">ir a login</Link>.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Categoria */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                ticketErrors.categoria ? "text-red-400" : "text-white/70"
              }`}>
                Categoria
              </label>
              <select
                value={ticketForm.categoria}
                onChange={(e) => {
                  setTicketForm((prev) => ({
                    ...prev,
                    categoria: e.target.value,
                  }));
                  if (ticketErrors.categoria) setTicketErrors({ ...ticketErrors, categoria: "" });
                }}
                className={`w-full border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors ${
                  ticketErrors.categoria
                    ? "bg-red-500/10 border-red-500/30 focus:border-red-400"
                    : "bg-white/5 border-white/10 focus:border-[#D4AF37]"
                }`}
              >
                <option>Alertas</option>
                <option>Bot</option>
                <option>Membresia</option>
                <option>Pagos</option>
                <option>Tecnico</option>
                <option>Otros</option>
              </select>
              {ticketErrors.categoria && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {ticketErrors.categoria}
                </p>
              )}
            </div>

            {/* Prioridad */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                ticketErrors.prioridad ? "text-red-400" : "text-white/70"
              }`}>
                Prioridad
              </label>
              <select
                value={ticketForm.prioridad}
                onChange={(e) => {
                  setTicketForm((prev) => ({
                    ...prev,
                    prioridad: e.target.value,
                  }));
                  if (ticketErrors.prioridad) setTicketErrors({ ...ticketErrors, prioridad: "" });
                }}
                className={`w-full border rounded-lg px-4 py-2 text-white focus:outline-none transition-colors ${
                  ticketErrors.prioridad
                    ? "bg-red-500/10 border-red-500/30 focus:border-red-400"
                    : "bg-white/5 border-white/10 focus:border-[#D4AF37]"
                }`}
              >
                <option>Baja</option>
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
              {ticketErrors.prioridad && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {ticketErrors.prioridad}
                </p>
              )}
            </div>
          </div>

          {/* Mensaje */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              ticketErrors.mensaje ? "text-red-400" : "text-white/70"
            }`}>
              Mensaje
            </label>
            <textarea
              value={ticketForm.mensaje}
              onChange={(e) => {
                setTicketForm((prev) => ({
                  ...prev,
                  mensaje: e.target.value,
                }));
                if (ticketErrors.mensaje) setTicketErrors({ ...ticketErrors, mensaje: "" });
              }}
              placeholder="Describe tu problema con al menos 10 caracteres..."
              className={`w-full border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none transition-colors h-28 resize-none ${
                ticketErrors.mensaje
                  ? "bg-red-500/10 border-red-500/30 focus:border-red-400"
                  : "bg-white/5 border-white/10 focus:border-[#D4AF37]"
              }`}
            />
            {ticketErrors.mensaje && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {ticketErrors.mensaje}
              </p>
            )}
          </div>

          {Object.keys(ticketErrors).length > 0 && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex gap-3 mb-6">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-semibold mb-1">Hay errores en el formulario</p>
                <ul className="text-xs text-red-400/80 space-y-0.5">
                  {Object.values(ticketErrors).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateTicket}
            className="bg-[#D4AF37] text-[#030303] font-bold py-3 px-6 rounded-lg hover:bg-[#E5C158] transition-all disabled:opacity-50"
            disabled={Object.keys(ticketErrors).length > 0 || creatingTicket}
          >
            {creatingTicket ? 'Creando ticket...' : 'Crear ticket'}
          </button>
        </motion.div>

        {/* Estado del Soporte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              label: 'Tiempo estimado',
              value: '24h',
              Icon: Clock,
            },
            {
              label: 'Chat IA',
              value: 'Disponible',
              Icon: MessageCircle,
            },
            {
              label: 'Tickets',
              value: 'Activos',
              Icon: CheckCircle2,
            },
            {
              label: 'Seguridad',
              value: 'Canal privado',
              Icon: Lock,
            },
          ].map((item, i) => {
            const IconComponent = item.Icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="bg-[#0B0B0B] border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent className="w-5 h-5 text-[#D4AF37]" />
                  <p className="text-sm text-white/70">{item.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">{item.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contacto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-[#D4AF37]/10 to-[#0B0B0B] border border-[#D4AF37]/30 rounded-2xl p-8 mb-8 text-center"
        >
          <h3 className="text-2xl font-bold mb-2">¿Prefieres contacto directo?</h3>
          <p className="text-white/70 mb-4">
            Puedes escribirnos a{' '}
            <span className="text-[#D4AF37] font-semibold">
              soporte@carvipix.com
            </span>
          </p>
        </motion.div>

        {/* Footer disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-white/50"
        >
          <p>
            El asistente y los tickets operan en entorno controlado y muestran
            informacion segun la disponibilidad de cada servicio.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
