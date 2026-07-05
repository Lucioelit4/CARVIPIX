import React from 'react';
import { borders, colors, spacing, typography } from '../tokens';

export type CARVIPIXBadgeVariant = 'default' | 'premium' | 'success' | 'warning' | 'danger' | 'admin' | 'info';

interface CARVIPIXBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: CARVIPIXBadgeVariant;
}

export function CARVIPIXBadge({ variant = 'default', style, children, ...props }: CARVIPIXBadgeProps) {
  const variantStyles: Record<CARVIPIXBadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: colors.white.secondary,
      border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    premium: {
      backgroundColor: 'rgba(212, 175, 55, 0.12)',
      color: colors.gold.primary,
      border: '1px solid rgba(212, 175, 55, 0.32)',
    },
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.14)',
      color: colors.success,
      border: '1px solid rgba(34, 197, 94, 0.32)',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.14)',
      color: colors.warning,
      border: '1px solid rgba(245, 158, 11, 0.32)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.14)',
      color: colors.error,
      border: '1px solid rgba(239, 68, 68, 0.32)',
    },
    admin: {
      backgroundColor: 'rgba(59, 130, 246, 0.14)',
      color: '#60A5FA',
      border: '1px solid rgba(59, 130, 246, 0.32)',
    },
    info: {
      backgroundColor: 'rgba(148, 163, 184, 0.14)',
      color: '#CBD5E1',
      border: '1px solid rgba(148, 163, 184, 0.28)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borders.radius.full,
        padding: `${spacing[4]} ${spacing[8]}`,
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
