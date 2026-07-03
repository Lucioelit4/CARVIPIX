"use client";

import CountUp from "react-countup";
import { Activity, BadgeCheck, Flame, Target } from "lucide-react";
import { CARVIPIXStatCard, colors, spacing, borders } from "../../design-system";

const stats = [
  { title: "Alertas activas", value: 3, note: "Operaciones abiertas", icon: Activity, color: "success" },
  { title: "Win Rate", value: 72.4, suffix: "%", note: "Últimos 30 días", icon: Target, color: "gold" },
  { title: "Profit Factor", value: 2.18, note: "Promedio mensual", icon: BadgeCheck, color: "white" },
  { title: "Racha actual", value: 5, note: "Alertas ganadas", icon: Flame, color: "gold" },
];

export default function AlertStats() {
  const safeStats = stats ?? [];

  return (
    <div style={{ display: 'grid', gap: spacing[16], gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {safeStats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: borders.radius.xl,
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              backgroundColor: `rgba(16, 20, 29, 0.9)`,
              padding: spacing[16],
              transition: 'all 300ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = 'translateY(-4px)';
              el.style.borderColor = `rgba(212, 175, 55, 0.5)`;
              el.style.boxShadow = `0 12px 30px rgba(212, 175, 55, 0.1)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = 'translateY(0)';
              el.style.borderColor = `rgba(255, 255, 255, 0.1)`;
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '112px', height: '112px', borderRadius: '50%', backgroundColor: `rgba(212, 175, 55, 0)`, filter: 'blur(48px)', transition: 'all 300ms ease', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: colors.white.secondary }}>{stat.title}</p>
              <Icon size={20} style={{ color: colors.gold.primary }} />
            </div>

            <p style={{ position: 'relative', marginTop: spacing[16], fontSize: '1.875rem', fontWeight: 700, color: stat.color === 'gold' ? colors.gold.primary : stat.color === 'success' ? '#22C55E' : colors.white.pure }}>
              <CountUp end={stat.value} decimals={stat.value % 1 !== 0 ? 2 : 0} duration={1.3} suffix={stat.suffix || ""} />
            </p>

            <p style={{ position: 'relative', marginTop: spacing[8], fontSize: '0.875rem', color: colors.white.secondary }}>{stat.note}</p>
          </div>
        );
      })}
    </div>
  );
}