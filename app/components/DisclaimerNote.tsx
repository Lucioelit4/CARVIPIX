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
    text: 'Contenido informativo sujeto a actualización operativa según disponibilidad del servicio.',
    icon: <Info size={14} />,
  },
  risk: {
    text: 'El trading implica riesgo significativo, incluida pérdida potencial de capital. Los resultados pasados no garantizan resultados futuros.',
    icon: <AlertTriangle size={14} />,
  },
  legal: {
    text: 'CARVIPIX proporciona herramientas y servicios informativos. No es un asesor financiero regulado ni gestor de inversiones autorizado.',
    icon: <Info size={14} />,
  },
  payment: {
    text: 'CARVIPIX no es empresa de fondeo. El servicio consiste en evaluación y seguimiento con empresas externas de acuerdo a sus reglas y condiciones.',
    icon: <Info size={14} />,
  },
  capital: {
    text: 'La gestión de capital implica riesgo y los resultados pueden variar. CARVIPIX no garantiza rendimientos específicos. La participación aplica únicamente sobre utilidades generadas bajo los términos publicados.',
    icon: <AlertTriangle size={14} />,
  },
  bot: {
    text: 'El Bot CARVIPIX automatiza reglas operativas y no garantiza resultados específicos. El trading implica riesgo. Consulta términos y condiciones antes de usar.',
    icon: <AlertTriangle size={14} />,
  },
  academy: {
    text: 'La Academia se habilita por etapas según el plan activo. El trading implica riesgo; CARVIPIX no garantiza resultados específicos.',
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
