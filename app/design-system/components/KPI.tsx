import React from 'react';
import CountUp from 'react-countup';
import { CARVIPIXCard } from './Card';
import { colors, spacing, typography } from '../tokens';

interface CARVIPIXKPIProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  helper?: string;
  tone?: 'default' | 'premium' | 'success' | 'danger';
}

export function CARVIPIXKPI({ label, value, suffix = '', prefix = '', helper, tone = 'default' }: CARVIPIXKPIProps) {
  const valueColor: Record<NonNullable<CARVIPIXKPIProps['tone']>, string> = {
    default: colors.white.pure,
    premium: colors.gold.primary,
    success: colors.success,
    danger: colors.error,
  };

  return (
    <CARVIPIXCard variant="statistics" padding="16" hover={false}>
      <p style={{ fontSize: typography.sizes.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.white.secondary }}>
        {label}
      </p>
      <p style={{ marginTop: spacing[8], color: valueColor[tone], fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold }}>
        {prefix}
        <CountUp end={value} decimals={value % 1 !== 0 ? 2 : 0} duration={1.1} />
        {suffix}
      </p>
      {helper && (
        <p style={{ marginTop: spacing[8], color: colors.white.secondary, fontSize: typography.sizes.xs }}>
          {helper}
        </p>
      )}
    </CARVIPIXCard>
  );
}
