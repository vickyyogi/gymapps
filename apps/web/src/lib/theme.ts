export const THEME_STORAGE_KEY = "gymapps-theme";

export const themeScript = `(function(){try{var key="${THEME_STORAGE_KEY}";var value=localStorage.getItem(key)||"system";var dark=value==="dark"||(value==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

// MiniDash Design System Tokens (for programmatic access)
export const designTokens = {
  colors: {
    primary: "#6366F1",
    primaryHover: "#4F46E5",
    primaryLight: "#EEF2FF",
    primaryForeground: "#FFFFFF",

    secondary: "#14B8A6",
    secondaryHover: "#0D9488",
    secondaryLight: "#CCFBF1",
    secondaryForeground: "#FFFFFF",

    tertiary: "#F59E0B",
    tertiaryHover: "#D97706",
    tertiaryLight: "#FEF3C7",
    tertiaryForeground: "#FFFFFF",

    background: "#F3F4F6",
    surface: "#FFFFFF",

    success: "#10B981",
    successLight: "#D1FAE5",
    successForeground: "#FFFFFF",

    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningForeground: "#FFFFFF",

    error: "#EF4444",
    errorLight: "#FEF2F2",
    errorForeground: "#FFFFFF",

    info: "#6366F1",
    infoLight: "#EEF2FF",
    infoForeground: "#FFFFFF",

    text: {
      primary: "#111827",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
      inverse: "#FFFFFF"
    },

    border: {
      default: "#E5E7EB",
      hover: "#D1D5DB",
      focus: "#6366F1"
    },

    metric: {
      primary: "#6366F1",
      positive: "#10B981",
      warning: "#F59E0B",
      negative: "#EF4444"
    }
  },

  darkColors: {
    background: "#111827",
    surface: "#1F2937",
    text: {
      primary: "#F9FAFB",
      secondary: "#9CA3AF",
      tertiary: "#6B7280"
    },
    border: {
      default: "#374151",
      hover: "#4B5563"
    }
  },

  spacing: {
    base: 4,
    scale: [4, 8, 12, 16, 20, 24, 32, 40, 48],
    componentPadding: {
      tight: 8,
      default: 12,
      relaxed: 16
    },
    sectionSpacing: 16,
    widgetGap: 8
  },

  borderRadius: {
    none: 0,
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    full: 9999
  },

  elevation: {
    subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
    medium: "0 2px 6px 0 rgb(0 0 0 / 0.06)",
    large: "0 6px 16px 0 rgb(0 0 0 / 0.10)",
    overlay: "0 12px 32px 0 rgb(0 0 0 / 0.14)"
  },

  typography: {
    fonts: {
      headline: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      body: "DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "IBM Plex Mono, 'SF Mono', 'Fira Code', monospace"
    },
    sizes: {
      display: 28,
      headline: 22,
      subhead: 17,
      bodyLarge: 15,
      body: 13,
      bodySmall: 12,
      caption: 11,
      overline: 10,
      code: 12
    },
    lineHeights: {
      display: 34,
      headline: 28,
      subhead: 24,
      bodyLarge: 22,
      body: 20,
      bodySmall: 18,
      caption: 16,
      overline: 14,
      code: 18
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  components: {
    button: {
      heights: {
        sm: 28,
        md: 36,
        lg: 44
      },
      padding: {
        sm: 8,
        md: 12,
        lg: 16
      },
      minTouchTarget: 44
    },
    input: {
      height: 36,
      borderRadius: 8
    },
    list: {
      rowHeight: 40,
      padding: "8px 12px"
    },
    checkbox: {
      size: 16,
      borderRadius: 4,
      touchTarget: 44
    },
    radio: {
      size: 16,
      touchTarget: 44
    },
    tooltip: {
      maxWidth: 180,
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: 11,
      delay: 300
    }
  }
} as const;

export type DesignTokens = typeof designTokens;