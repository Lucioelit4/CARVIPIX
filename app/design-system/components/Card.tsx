/**
 * CARVIPIXCard
 * Unified card container component
 */

import React from 'react';
import { colors, spacing, borders, shadows } from '../tokens';

interface CARVIPIXCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
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
      border: `1px solid rgba(212, 175, 55, 0.2)`,
      boxShadow: shadows.subtle,
    },
    elevated: {
      border: `1px solid rgba(212, 175, 55, 0.4)`,
      boxShadow: shadows.hover,
    },
    outlined: {
      border: `1px solid rgba(255, 255, 255, 0.1)`,
      boxShadow: 'none',
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
