"use client";

import CountUp from "react-countup";
import { Activity, BadgeCheck, Flame, Target } from "lucide-react";

const stats = [
  { title: "Alertas activas", value: 3, note: "Operaciones abiertas", icon: Activity, color: "text-green-400" },
  { title: "Win Rate", value: 72.4, suffix: "%", note: "Últimos 30 días", icon: Target, color: "text-[#D4AF37]" },
  { title: "Profit Factor", value: 2.18, note: "Promedio mensual", icon: BadgeCheck, color: "text-purple-400" },
  { title: "Racha actual", value: 5, note: "Alertas ganadas", icon: Flame, color: "text-orange-400" },
];

export default function AlertStats() {
  const safeStats = stats ?? [];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {safeStats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#10141D]/90 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-300 group-hover:bg-[#D4AF37]/20" />

            <div className="relative flex items-center justify-between">
              <p className="text-xs uppercase text-zinc-500">{stat.title}</p>
              <Icon size={20} className="text-[#D4AF37]" />
            </div>

            <p className={`relative mt-4 text-3xl font-bold ${stat.color}`}>
              <CountUp end={stat.value} decimals={stat.value % 1 !== 0 ? 2 : 0} duration={1.3} suffix={stat.suffix || ""} />
            </p>

            <p className="relative mt-2 text-sm text-zinc-500">{stat.note}</p>
          </div>
        );
      })}
    </div>
  );
}