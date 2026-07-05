/**
 * CARVIPIXCard
 * Unified card container component
 */

import React from 'react';
import { colors, spacing, borders, shadows } from '../tokens';

interface CARVIPIXCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'info' | 'statistics' | 'risk' | 'alert' | 'premium' | 'admin';
  hover?: boolean;
  padding?: keyof typeof spacing;
}

export const CARVIPIXCard: React.FC<CARVIPIXCardProps> = ({
  variant = 'default',
  hover = true,
  padding = '24',
  className = '',
  children,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: colors.black.darker,
    borderRadius: `${borders.radius.lg}`,
    transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    padding: spacing[padding as keyof typeof spacing],
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      border: `1px solid ${colors.black.border}`,
      boxShadow: shadows.subtle,
    },
    elevated: {
      border: `1px solid rgba(212, 175, 55, 0.35)`,
      backgroundColor: colors.black.elevated,
      boxShadow: shadows.hover,
    },
    outlined: {
      border: `1px solid rgba(255, 255, 255, 0.1)`,
      boxShadow: 'none',
    },
    info: {
      border: `1px solid ${colors.black.border}`,
      backgroundColor: colors.black.darker,
      boxShadow: shadows.subtle,
    },
    statistics: {
      border: `1px solid rgba(212, 175, 55, 0.35)`,
      backgroundColor: colors.black.elevated,
      boxShadow: shadows.glow.sm,
    },
    risk: {
      border: `1px solid rgba(239, 68, 68, 0.3)`,
      backgroundColor: 'rgba(30, 14, 14, 0.9)',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.12)',
    },
    alert: {
      border: `1px solid rgba(245, 158, 11, 0.35)`,
      backgroundColor: 'rgba(24, 20, 11, 0.92)',
      boxShadow: '0 0 10px rgba(245, 158, 11, 0.12)',
    },
    premium: {
      border: `1px solid rgba(212, 175, 55, 0.5)`,
      background: 'linear-gradient(180deg, rgba(24, 24, 24, 0.96) 0%, rgba(18, 18, 18, 0.96) 100%)',
      boxShadow: shadows.glow.md,
    },
    admin: {
      border: `1px solid ${colors.black.border}`,
      backgroundColor: colors.black.elevated,
      boxShadow: shadows.subtle,
    },
  };

  const hoverStyle = hover
    ? {
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(212, 175, 55, 0.6)',
          boxShadow: shadows.glow.lg,
        },
      }
    : {};

  return (
    <div
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...hoverStyle,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export default CARVIPIXCard;
