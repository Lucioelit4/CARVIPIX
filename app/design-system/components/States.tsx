import React from 'react';
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { CARVIPIXCard } from './Card';
import { colors, spacing, typography } from '../tokens';

interface BaseStateProps {
  title: string;
  message: string;
}

function BaseState({ title, message, icon }: BaseStateProps & { icon: React.ReactNode }) {
  return (
    <CARVIPIXCard variant="info" padding="24" hover={false}>
      <div style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: spacing[12] }}>
        {icon}
        <h4 style={{ color: colors.white.pure, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold }}>{title}</h4>
        <p style={{ color: colors.white.secondary, fontSize: typography.sizes.sm, maxWidth: '32rem' }}>{message}</p>
      </div>
    </CARVIPIXCard>
  );
}

export function CARVIPIXLoadingState({ title = 'Cargando datos', message = 'Estamos preparando la información de la sala.' }: Partial<BaseStateProps>) {
  return (
    <BaseState
      title={title}
      message={message}
      icon={<LoaderCircle size={28} color={colors.gold.primary} className="animate-spin" />}
    />
  );
}

export function CARVIPIXEmptyState({ title = 'Sin resultados', message = 'No hay información para mostrar con los filtros actuales.' }: Partial<BaseStateProps>) {
  return (
    <BaseState
      title={title}
      message={message}
      icon={<Inbox size={28} color={colors.white.secondary} />}
    />
  );
}

export function CARVIPIXErrorState({ title = 'Error de carga', message = 'Ocurrió un problema al recuperar datos. Intenta nuevamente.' }: Partial<BaseStateProps>) {
  return (
    <BaseState
      title={title}
      message={message}
      icon={<AlertCircle size={28} color={colors.error} />}
    />
  );
}
