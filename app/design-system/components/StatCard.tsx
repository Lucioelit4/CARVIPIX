/**
 * CARVIPIXStatCard
 * Specialized card for displaying statistics (numbers + context)
 */

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { colors, spacing, typography, animations, borders, shadows } from '../tokens';

interface CARVIPIXStatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  description?: string;
  icon?: React.ComponentType<{ size: number; className: string }>;
  color?: 'gold' | 'white' | 'success';
}

export const CARVIPIXStatCard: React.FC<CARVIPIXStatCardProps> = ({
  label,
  value,
  prefix = '',
  suffix = '',
  trend = '',
  description = '',
  icon: Icon,
  color = 'white',
}) => {
  const colorMap = {
    gold: colors.gold.primary,
    white: colors.white.pure,
    success: '#22C55E',
  };

  const textColor = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: 'easeOut',
      }}
      style={{
        backgroundColor: colors.black.darker,
        border: `1px solid rgba(212, 175, 55, 0.2)`,
        borderRadius: borders.radius.lg,
        padding: spacing[32],
        boxShadow: shadows.subtle,
      }}
      whileHover={{
        y: -4,
        borderColor: 'rgba(212, 175, 55, 0.6)',
        boxShadow: shadows.glow.lg,
      }}
    >
      {/* Header: Label + Icon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[16],
        }}
      >
        <span
          style={{
            fontSize: typography.sizes.sm,
            color: colors.white.secondary,
            fontFamily: typography.fonts.sans,
            fontWeight: typography.weights.medium,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        {Icon && (
          <Icon size={28} className="text-[#D4AF37]" />
        )}
      </div>

      {/* Main Number */}
      <div
        style={{
          marginBottom: spacing[8],
        }}
      >
        <span
          style={{
            fontSize: typography.sizes['3xl'],
            fontFamily: typography.fonts.mono,
            fontWeight: typography.weights.bold,
            color: textColor,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: spacing[4],
          }}
        >
          {prefix && <span style={{ fontSize: typography.sizes.lg }}>{prefix}</span>}
          <CountUp
            end={value}
            decimals={2}
            duration={2}
            separator=","
          />
          {suffix && <span style={{ fontSize: typography.sizes.lg }}>{suffix}</span>}
        </span>
      </div>

      {/* Description Row */}
      {(description || trend) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: typography.sizes.xs,
            color: colors.white.secondary,
            marginTop: spacing[12],
            paddingTop: spacing[12],
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          {description && <span>{description}</span>}
          {trend && (
            <span
              style={{
                color: trend.startsWith('-') ? '#EF4444' : '#22C55E',
                fontWeight: typography.weights.semibold,
              }}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CARVIPIXStatCard;
