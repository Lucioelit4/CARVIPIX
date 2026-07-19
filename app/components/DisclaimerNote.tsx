'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

type DisclaimerVariant = 'demo' | 'risk' | 'legal' | 'payment' | 'capital' | 'bot' | 'academy' | 'support';

interface DisclaimerNoteProps {
  variant: DisclaimerVariant;
  className?: string;
}

const disclaimerMessages: Record<DisclaimerVariant, { text: string; icon?: React.ReactNode }> = {
  demo: {
    text: 'Contenido informativo sujeto a actualizacion operativa segun disponibilidad del servicio.',
    icon: <Info size={14} />,
  },
  risk: {
    text: 'El trading implica riesgo significativo, incluida posible perdida de capital. Los resultados historicos no garantizan resultados futuros.',
    icon: <AlertTriangle size={14} />,
  },
  legal: {
    text: 'CARVIPIX proporciona herramientas y servicios informativos. No ofrece asesoria financiera personalizada ni administracion de dinero.',
    icon: <Info size={14} />,
  },
  payment: {
    text: 'CARVIPIX no opera como empresa de fondeo. Cualquier servicio de este tipo se publicara solo cuando exista lanzamiento formal y condiciones oficiales.',
    icon: <Info size={14} />,
  },
  capital: {
    text: 'El proceso de Socios Estrategicos es una evaluacion comercial privada. CARVIPIX no garantiza aceptacion ni colaboracion hasta la firma del acuerdo correspondiente.',
    icon: <AlertTriangle size={14} />,
  },
  bot: {
    text: 'El Bot CARVIPIX automatiza reglas operativas y no garantiza resultados especificos. El trading implica riesgo. Consulta terminos y condiciones antes de usar.',
    icon: <AlertTriangle size={14} />,
  },
  academy: {
    text: 'La Academia se habilita por etapas segun el plan activo. El trading implica riesgo y CARVIPIX no garantiza resultados especificos.',
    icon: <Info size={14} />,
  },
  support: {
    text: 'Centro de soporte CARVIPIX para consultas operativas y seguimiento de solicitudes.',
    icon: <Info size={14} />,
  },
};

export default function DisclaimerNote({ variant, className = '' }: DisclaimerNoteProps) {
  const disclaimer = disclaimerMessages[variant];

  const baseClasses = 'text-xs text-white/60 leading-relaxed';
  const containerClasses = `flex items-start gap-2 ${className}`;
  const iconClasses = 'text-white/50 flex-shrink-0 mt-0.5';

  return (
    <div className={containerClasses}>
      {disclaimer.icon && <div className={iconClasses}>{disclaimer.icon}</div>}
      <p className={baseClasses}>{disclaimer.text}</p>
    </div>
  );
}
