import Link, { type LinkProps } from 'next/link';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'premium' | 'disabled' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CARVIPIXButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  'aria-disabled'?: boolean;
  title?: string;
  target?: string;
  rel?: string;
}

export function CARVIPIXButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}: CARVIPIXButtonLinkProps) {
  const buttonClassName = [
    'cv-button',
    `cv-button--${variant}`,
    `cv-button--${size}`,
    fullWidth ? 'cv-button--fullWidth' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={buttonClassName} {...props}>
      {leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span>{rightIcon}</span>}
    </Link>
  );
}

export default CARVIPIXButtonLink;