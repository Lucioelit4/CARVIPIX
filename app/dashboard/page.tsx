'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
  Timer,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import { getCurrentRole, writeAuthSession } from '@/app/lib/auth/session';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

const moduleCards = [
  {
    title: 'Alertas en Vivo',
    desc: 'Senales y seguimiento operativo en tiempo real.',
    href: '/alertas',
    cta: 'Ir a alertas',
    badge: 'EN VIVO',
    icon: BarChart3,
  },
  {
    title: 'Resultados',
    desc: 'Resumen de desempeno y trazabilidad de operaciones.',
    href: '/resultados',
    cta: 'Ver resultados',
    badge: 'VERIFICADOS',
    icon: Trophy,
  },
  {
    title: 'Bot CARVIPIX',
    desc: 'Gestion de automatizacion y vista del estado del bot.',
    href: '/bot',
    cta: 'Abrir bot',
    badge: 'AUTOMATIZADO',
    icon: Bot,
  },
  {
    title: 'Perfil',
    desc: 'Configuracion de cuenta, seguridad y membresia.',
    href: '/perfil',
    cta: 'Ir a perfil',
    badge: 'MI CUENTA',
    icon: UserCircle2,
  },
];

const kpis = [
  {
    label: 'Alertas hoy',
    value: '23',
    note: '+15% vs ayer',
    icon: Bell,
    tone: 'text-[#2ECC71]',
  },
  {
    label: 'Operaciones',
    value: '156',
    note: '+8% vs ayer',
    icon: Gauge,
    tone: 'text-[#2ECC71]',
  },
  {
    label: 'Ganancia neta',
    value: '+2.48%',
    note: 'Performance',
    icon: CircleDollarSign,
    tone: 'text-[#F4C542]',
  },
  {
    label: 'Win Rate',
    value: '78.6%',
    note: 'Ultimos 30 dias',
    icon: Trophy,
    tone: 'text-white',
  },
  {
    label: 'Drawdown',
    value: '4.21%',
    note: 'Riesgo controlado',
    icon: ShieldCheck,
    tone: 'text-white',
  },
  {
    label: 'Estado del bot',
    value: 'ACTIVO',
    note: 'Operando',
    icon: Timer,
    tone: 'text-[#2ECC71]',
  },
];

const news = [
  {
    time: '10:42',
    title: 'Actualizacion del Bot CARVIPIX',
    desc: 'Nueva version 2.4.0 disponible',
  },
  {
    time: '09:15',
    title: 'Reporte de resultados semanal',
    desc: 'Ya disponible en tu panel',
  },
  {
    time: 'Ayer',
    title: 'Nuevas estrategias anadidas',
    desc: 'Optimizacion de rendimiento',
  },
];

export default function DashboardPage() {
  useEffect(() => {
    if (getCurrentRole() === 'invitado') {
      writeAuthSession('cliente');
    }

  }, []);

  return (
    <main className="space-y-5 pb-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#121212] p-5 sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_45%,rgba(212,175,55,0.22),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(3,3,3,0.96)_40%,rgba(3,3,3,0.58)_100%)]" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F4C542]">
              Plataforma premium
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Todo tu trading.
              <span className="block text-[#F4C542]">En un solo lugar.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm text-[#B5B5B5] sm:text-base">
              Alertas en tiempo real, resultados verificados, automatizacion inteligente y herramientas
              profesionales para traders que exigen mas.
            </p>

            <div className="mt-6">
              <Link href="/alertas" className="inline-flex">
                <CARVIPIXButton variant="premium" rightIcon={<ArrowRight size={16} />}>
                  Explorar plataforma
                </CARVIPIXButton>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-4 sm:min-h-[280px]">
            <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-[#D4AF37]/20 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-[#D4AF37]/15 blur-2xl" />

            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage:
                'linear-gradient(rgba(212,175,55,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.16) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }} />

            <div className="relative flex h-full items-center justify-center">
              <div className="absolute left-3 top-4 rounded-xl border border-[#2A2A2A] bg-[#121212]/90 px-3 py-2 text-xs text-[#B5B5B5]">
                BTCUSD
                <p className="mt-1 text-sm font-semibold text-[#2ECC71]">+2.45%</p>
              </div>
              <div className="absolute right-3 top-6 rounded-xl border border-[#2A2A2A] bg-[#121212]/90 px-3 py-2 text-xs text-[#B5B5B5]">
                XAUUSD
                <p className="mt-1 text-sm font-semibold text-[#2ECC71]">+2.85%</p>
              </div>
              <div className="absolute bottom-4 right-4 rounded-xl border border-[#2A2A2A] bg-[#121212]/90 px-3 py-2 text-xs text-[#B5B5B5]">
                EURUSD
                <p className="mt-1 text-sm font-semibold text-[#E74C3C]">-0.35%</p>
              </div>

              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#121212] shadow-[0_0_60px_rgba(212,175,55,0.35)] sm:h-36 sm:w-36">
                <Image
                  src="/logo/logo carvipix.png"
                  alt="CARVIPIX"
                  width={120}
                  height={32}
                  className="h-auto w-20 sm:w-24"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((card) => {
          const Icon = card.icon;
          return (
            <CARVIPIXCard key={card.title} variant="default" padding="24" hover className="bg-[#121212]">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-2 text-[#D4AF37]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-[#2A2A2A] bg-[#181818] px-2 py-1 text-[10px] font-semibold text-[#F4C542]">
                  {card.badge}
                </span>
              </div>
              <h3 className="text-[1.95rem] font-semibold leading-tight text-white">{card.title}</h3>
              <p className="mt-2 min-h-[52px] text-sm text-[#B5B5B5]">{card.desc}</p>
              <Link href={card.href} className="mt-5 block">
                <CARVIPIXButton variant={card.title === 'Alertas en Vivo' ? 'premium' : 'secondary'} fullWidth>
                  {card.cta}
                </CARVIPIXButton>
              </Link>
            </CARVIPIXCard>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="rounded-xl border border-[#2A2A2A] bg-[#121212] px-4 py-4 transition hover:border-[#D4AF37]/45"
            >
              <div className="mb-2 flex items-center gap-2 text-[#F4C542]">
                <Icon size={15} />
                <p className="text-xs text-[#B5B5B5]">{kpi.label}</p>
              </div>
              <p className={`text-3xl font-semibold tracking-tight ${kpi.tone}`}>{kpi.value}</p>
              <p className="mt-1 text-xs text-[#B5B5B5]">{kpi.note}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#2A2A2A] bg-[#121212] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Noticias importantes</h3>
            <p className="text-sm text-[#B5B5B5]">Mantente informado con lo ultimo del mercado y actualizaciones de CARVIPIX.</p>
          </div>
          <Link href="/soporte">
            <CARVIPIXButton size="sm" variant="ghost">Ver todas</CARVIPIXButton>
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {news.map((item) => (
            <article key={item.title} className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4">
              <p className="text-xs text-[#B5B5B5]">{item.time}</p>
              <h4 className="mt-2 text-sm font-semibold text-white">{item.title}</h4>
              <p className="mt-1 text-xs text-[#B5B5B5]">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}