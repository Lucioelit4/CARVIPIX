/**
 * CARVIPIXButton
 * Unified button component following CARVIPIX design identity
 */

import React from 'react';
import { motion } from 'framer-motion';
import { colors, spacing, animations, sizes, typography, borders, shadows } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CARVIPIXButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getVariantStyles = (variant: ButtonVariant) => {
  const baseStyle = {
    fontFamily: typography.fonts.sans,
    fontWeight: typography.weights.semibold,
    border: 'none',
    cursor: 'pointer',
    transition: `all ${animations.durations.fast} ${animations.easing.responsive}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    position: 'relative' as const,
  };

  const variants = {
    primary: {
      ...baseStyle,
      backgroundColor: colors.gold.primary,
      color: colors.black.pure,
      border: `${borders.width.thin} solid ${colors.gold.primary}`,
      boxShadow: shadows.glow.md,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.gold.bright,
        boxShadow: shadows.glow.lg,
        transform: 'translateY(-2px)',
      },
      
      '&:active:not(:disabled)': {
        transform: 'translateY(0)',
      },
      
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },

    secondary: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: colors.gold.primary,
      border: `${borders.width.thin} solid ${colors.gold.primary}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: `rgba(212, 175, 55, 0.1)`,
        boxShadow: shadows.glow.md,
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: `rgba(212, 175, 55, 0.2)`,
      },
      
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },

    ghost: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: colors.white.pure,
      border: `${borders.width.thin} solid rgba(255, 255, 255, 0.2)`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
      
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },

    danger: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: colors.error,
      border: `${borders.width.thin} solid ${colors.error}`,
      
      '&:hover:not(:disabled)': {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
      
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  };

  return variants[variant];
};

const getSizeStyles = (size: ButtonSize) => {
  const sizeMap = {
    sm: {
      height: sizes.button.sm.height,
      padding: sizes.button.sm.padding,
      fontSize: sizes.button.sm.fontSize,
      borderRadius: borders.radius.sm,
    },
    md: {
      height: sizes.button.md.height,
      padding: sizes.button.md.padding,
      fontSize: sizes.button.md.fontSize,
      borderRadius: borders.radius.md,
    },
    lg: {
      height: sizes.button.lg.height,
      padding: sizes.button.lg.padding,
      fontSize: sizes.button.lg.fontSize,
      borderRadius: borders.radius.lg,
    },
  };

  return sizeMap[size];
};

export const CARVIPIXButton: React.FC<CARVIPIXButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <motion.button
      whileHover={{ y: disabled ? 0 : -2 }}
      whileTap={{ y: disabled ? 0 : 0 }}
      style={{
        ...variantStyles,
        ...sizeStyles,
        width: fullWidth ? '100%' : 'auto',
        minWidth: sizes.touchTarget,
      }}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: `2px solid currentColor`,
            borderTopColor: 'transparent',
          }}
        />
      )}
      
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      
      {children}
      
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </motion.button>
  );
};

export default CARVIPIXButton;
