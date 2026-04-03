import { colors } from './colors';

// 🏛️ MARKETFLOW INSTITUTIONAL DESIGN SYSTEM

export const theme = {
  colors,

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
  },

  // Spacing - 4px System
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // Shadows - Subtle
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    none: 'none',
  },

  // Transitions - Subtle only
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Components presets
  components: {
    button: {
      primary: {
        bg: colors.accent.cyan[600],
        bgHover: colors.accent.cyan[700],
        text: colors.text.primary,
        border: 'none',
      },
      secondary: {
        bg: colors.secondary[800],
        bgHover: colors.secondary[700],
        text: colors.text.primary,
        border: `1px solid ${colors.border.primary}`,
      },
      ghost: {
        bg: 'transparent',
        bgHover: colors.secondary[900],
        text: colors.text.secondary,
        border: `1px solid ${colors.border.secondary}`,
      },
    },
    card: {
      bg: colors.bg.card,
      border: `1px solid ${colors.border.primary}`,
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
    },
    input: {
      bg: colors.bg.secondary,
      border: `1px solid ${colors.border.primary}`,
      borderFocus: `1px solid ${colors.accent.cyan[600]}`,
      text: colors.text.primary,
      placeholder: colors.text.muted,
    },
  },

  // Layout
  layout: {
    maxWidth: '1920px',
    containerPadding: '2rem',
    gridGap: '1.5rem',
  },
};

// 🎯 DESIGN PRINCIPLES
// ✅ Sober, mature, premium
// ✅ Strong visual hierarchy
// ✅ Generous spacing
// ✅ Controlled contrast
// ❌ No flashy animations
// ❌ No excessive gradients
// ❌ No decorative effects
