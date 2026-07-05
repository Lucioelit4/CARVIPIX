import React from 'react';
import { CARVIPIXCard } from './Card';
import { spacing, typography, colors } from '../tokens';

interface CARVIPIXPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: 'info' | 'statistics' | 'risk' | 'alert' | 'premium' | 'admin';
  padding?: '16' | '24' | '32';
}

export function CARVIPIXPanel({
  title,
  subtitle,
  variant = 'info',
  padding = '24',
  children,
  ...props
}: CARVIPIXPanelProps) {
  return (
    <CARVIPIXCard variant={variant} padding={padding} {...props}>
      {(title || subtitle) && (
        <header style={{ marginBottom: spacing[16], display: 'grid', gap: spacing[8] }}>
          {title && (
            <h3 style={{ color: colors.white.pure, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ color: colors.white.secondary, fontSize: typography.sizes.sm }}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </CARVIPIXCard>
  );
}
