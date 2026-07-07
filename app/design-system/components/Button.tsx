/**
 * CARVIPIXButton
 * Unified button component following CARVIPIX design identity
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { borders, sizes } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'premium' | 'disabled' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CARVIPIXButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

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
  type = 'button',
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}) => {
  const sizeStyles = getSizeStyles(size);
  const forceDisabled = variant === 'disabled';
  const buttonClassName = [
    'cv-button',
    `cv-button--${variant}`,
    `cv-button--${size}`,
    fullWidth ? 'cv-button--fullWidth' : null,
    isLoading ? 'is-loading' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      type={type}
      whileHover={{ y: disabled || forceDisabled ? 0 : -2 }}
      whileTap={{ y: disabled || forceDisabled ? 0 : 0 }}
      aria-busy={isLoading || undefined}
      className={buttonClassName}
      style={{
        ...sizeStyles,
        width: fullWidth ? '100%' : 'auto',
        minWidth: size === 'sm' ? 40 : sizes.touchTarget,
      }}
      disabled={disabled || isLoading || forceDisabled}
      {...props}
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
