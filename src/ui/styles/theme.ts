/**
 * MayhemAI Dark Theme
 * Fusion 360 / CAD-inspired dark color palette
 */

export const theme = {
  colors: {
    // Background layers (darkest to lightest)
    bg: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      tertiary: '#0f3460',
      elevated: '#1f2b46',
      hover: '#2a3f5f',
    },

    // Text hierarchy
    text: {
      primary: '#ffffff',
      secondary: '#a0aec0',
      tertiary: '#718096',
      accent: '#4fd1c5',
    },

    // Accent colors
    accent: {
      primary: '#4fd1c5',
      secondary: '#667eea',
      highlight: '#f6ad55',
      success: '#48bb78',
      error: '#fc8181',
      info: '#63b3ed',
    },

    // Border colors
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      default: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.20)',
      accent: '#4fd1c5',
    },

    // Pipeline stage colors
    pipeline: {
      pending: '#718096',
      running: '#667eea',
      completed: '#48bb78',
      failed: '#fc8181',
    },

    // 3D Viewer
    viewer: {
      background: '#0a0f1a',
      grid: '#2d3748',
      axes: {
        x: '#fc8181',
        y: '#48bb78',
        z: '#63b3ed',
      },
    },

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      accent: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)',
      header: 'linear-gradient(90deg, #1a1a2e 0%, #0f3460 100%)',
    },
  },

  // Spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(79, 209, 197, 0.3)',
  },

  // Typography
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    monoFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Panel dimensions
  panels: {
    minWidth: 280,
    maxWidth: 450,
    defaultWidth: 340,
    collapsedWidth: 48,
    headerHeight: 56,
    statusBarHeight: 32,
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },

  // Z-index layers
  zIndex: {
    panel: 10,
    header: 20,
    overlay: 30,
    modal: 40,
    tooltip: 50,
  },
};

export type Theme = typeof theme;
