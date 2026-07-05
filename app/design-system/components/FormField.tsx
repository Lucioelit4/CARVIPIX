import React from 'react';
import { borders, colors, spacing, typography } from '../tokens';

interface CARVIPIXFormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function CARVIPIXFormField({ label, hint, error, children }: CARVIPIXFormFieldProps) {
  return (
    <div style={{ display: 'grid', gap: spacing[8] }}>
      <label style={{ color: error ? colors.error : colors.white.text, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium }}>
        {label}
      </label>
      <div
        style={{
          borderRadius: borders.radius.lg,
          border: `1px solid ${error ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
          backgroundColor: 'rgba(10, 15, 22, 0.9)',
          padding: spacing[8],
        }}
      >
        {children}
      </div>
      {error ? (
        <p style={{ color: colors.error, fontSize: typography.sizes.xs }}>{error}</p>
      ) : hint ? (
        <p style={{ color: colors.white.secondary, fontSize: typography.sizes.xs }}>{hint}</p>
      ) : null}
    </div>
  );
}
