/**
 * CARVIPIX Design System Tokens
 * Single source of truth for all design values
 * Based on IDENTIDAD_VISUAL_CARVIPIX_v1.md
 */

// ============================================
// COLORS
// ============================================

export const colors = {
  // Primary: Black (Control)
  black: {
    pure: '#000000',
    dark: '#05070B',
    darker: '#0B111A',
  },

  // Secondary: Gold (Precision)
  gold: {
    primary: '#D4AF37',
    bright: '#E6C547',
    muted: '#B8960F',
  },

  // Tertiary: White (Clarity)
  white: {
    pure: '#FFFFFF',
    text: '#C0C0C0', // 70% opacity equivalent
    secondary: '#808080', // 50% opacity equivalent
  },

  // Functional (semantic usage only)
  success: '#22C55E', // Green for positive
  warning: '#F59E0B', // Amber for warning
  error: '#EF4444', // Red for error
} as const;

// ============================================
// SPACING (8px grid system)
// ============================================

export const spacing = {
  '4': '4px', // 0.5 unit
  '8': '8px', // 1 unit
  '12': '12px', // 1.5 units
  '16': '16px', // 2 units
  '24': '24px', // 3 units
  '32': '32px', // 4 units
  '40': '40px', // 5 units
  '48': '48px', // 6 units
  '56': '56px', // 7 units
  '64': '64px', // 8 units
  '80': '80px', // 10 units
  '96': '96px', // 12 units
  '128': '128px', // 16 units
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Menlo, monospace',
  },

  sizes: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
    '5xl': '72px',
  },

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

// ============================================
// SHADOWS & DEPTH
// ============================================

export const shadows = {
  none: 'none',
  
  // Subtle (panels, cards)
  subtle: '-2px -2px 8px rgba(0, 0, 0, 0.3)',
  
  // Glow (active elements, numbers)
  glow: {
    sm: '0 0 4px rgba(212, 175, 55, 0.2)',
    md: '0 0 8px rgba(212, 175, 55, 0.3)',
    lg: '0 0 16px rgba(212, 175, 55, 0.4)',
  },
  
  // Elevation (hover states)
  hover: '-4px -4px 12px rgba(0, 0, 0, 0.4)',
  
  // Internal (inset shadows for depth)
  inset: 'inset -2px -2px 8px rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// BORDERS & RADII
// ============================================

export const borders = {
  radius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  width: {
    thin: '1px',
    base: '2px',
  },

  colors: {
    gold: `1px solid ${colors.gold.primary}`,
    goldSubtle: `1px solid rgba(212, 175, 55, 0.2)`,
    goldActive: `1px solid rgba(212, 175, 55, 0.4)`,
    white: `1px solid ${colors.white.pure}`,
    whiteSoft: `1px solid rgba(255, 255, 255, 0.1)`,
  },
} as const;

// ============================================
// ANIMATIONS & TIMING
// ============================================

export const animations = {
  durations: {
    fast: '200ms', // User interaction response
    normal: '400ms', // Standard transitions
    medium: '600ms', // Data updates
    slow: '1000ms', // Slow animations
    verySlow: '1500ms', // Slow process animations
    slowest: '2000ms', // Important state changes
  },

  easing: {
    // Fast response (bounce)
    responsive: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    
    // Standard smooth
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    // Organic/ease-out
    organic: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
    
    // Linear (for rotating elements)
    linear: 'linear',
  },

  transitions: {
    fast: {
      duration: '200ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    normal: {
      duration: '400ms',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    slow: {
      duration: '1000ms',
      easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
    },
  },
} as const;

// ============================================
// BREAKPOINTS (Mobile-first)
// ============================================

export const breakpoints = {
  mobile: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndex = {
  hide: '-1',
  base: '0',
  dropdown: '10',
  sticky: '20',
  fixed: '30',
  modal: '40',
  popover: '50',
  tooltip: '60',
} as const;

// ============================================
// COMPONENT SIZES
// ============================================

export const sizes = {
  // Button
  button: {
    sm: {
      height: '32px',
      padding: '6px 12px',
      fontSize: '12px',
    },
    md: {
      height: '40px',
      padding: '8px 16px',
      fontSize: '14px',
    },
    lg: {
      height: '48px',
      padding: '12px 24px',
      fontSize: '16px',
    },
  },

  // Input
  input: {
    height: '40px',
    padding: '8px 12px',
    fontSize: '14px',
  },

  // Interactive target (accessibility)
  touchTarget: '44px',

  // Icon sizes
  icon: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '32px',
    xl: '40px',
  },

  // Card
  card: {
    padding: '24px',
    paddingCompact: '16px',
  },

  // Panel
  panel: {
    padding: '32px',
  },
} as const;

// ============================================
// GRADIENTS
// ============================================

export const gradients = {
  // Background
  background: 'linear-gradient(to bottom, #050709, #0B111A)',
  
  // Subtle accent
  accentSubtle: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)',
  
  // Fade to transparent (for overlays)
  fadeBlack: 'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))',
  fadeGold: 'linear-gradient(to right, rgba(212, 175, 55, 0), rgba(212, 175, 55, 0.4), rgba(212, 175, 55, 0))',
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert opacity percentage to CSS rgba value
 * Usage: opacity('white', 50) => rgba(255, 255, 255, 0.5)
 */
export const opacity = (colorName: keyof typeof colors, percent: number): string => {
  const op = percent / 100;
  return `rgba(${colorName}, ${op})`;
};

/**
 * Get responsive styles object for Tailwind
 */
export const responsive = (mobile: string, tablet: string, desktop: string) => ({
  sm: mobile,
  md: tablet,
  lg: desktop,
});
