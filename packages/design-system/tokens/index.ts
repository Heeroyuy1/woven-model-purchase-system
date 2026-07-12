/**
 * Woven Model Design System Tokens
 * Mirrors the branding of the main Woven Model website.
 */
export const colors = {
  navy: {
    950: '#0a0f1e',
    900: '#0d1428',
    800: '#111b36',
    700: '#162244',
    600: '#1c2d56',
    500: '#243a6b',
  },
  cyan: {
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
  },
  white: '#ffffff',
  gray: {
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
} as const;

export const fonts = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const glassEffects = {
  bg: 'rgba(17, 27, 54, 0.6)',
  border: 'rgba(34, 211, 238, 0.15)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  blur: 'blur(16px)',
} as const;

export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
} as const;

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 20px rgba(0, 0, 0, 0.3)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.5)',
  glow: '0 4px 16px rgba(6, 182, 212, 0.35)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1200px',
} as const;

export const designTokens = {
  colors,
  fonts,
  glassEffects,
  spacing,
  radii,
  transitions,
  shadows,
  breakpoints,
};
