import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        /* Roadmap 3.2: sans = Inter (treść, formularze) */
        sans: ['Inter', 'system-ui', 'sans-serif'],
        /* Roadmap 3.2: display = Bricolage Grotesque (nagłówki H1-H4) — self-hosted */
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        /* Roadmap 3.2: mono = JetBrains Mono (liczby, kwoty PLN, kody) — self-hosted */
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Amber CTA tokens — landing page (PR-LP-01: restored 3-step palette)
          amber:          "#F59E0B",   // amber-500 — base
          'amber-light':  "#FBBF24",   // amber-400 — hover (brighter)
          'amber-hover':  "#D97706",   // amber-600 — active (darker press)
          'amber-subtle': "#FEF3C7",   // amber-100 — subtle tint
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          muted: "hsl(var(--card-muted))",
        },
        chrome: {
          DEFAULT: "hsl(var(--chrome))",
          foreground: "hsl(var(--chrome-foreground))",
        },
        // Backward-compatible: gradient mapped to primary (no actual gradient)
        gradient: {
          start: "hsl(var(--gradient-start))",
          mid: "hsl(var(--gradient-mid))",
          end: "hsl(var(--gradient-end))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Landing page v3 brand tokens
        brand: {
          amber:        '#F59E0B',
          'amber-dim':  '#D97706',
          'amber-glow': 'rgba(245,158,11,0.12)',
          dark:         '#0F0F0F',
          card:         '#1A1A1A',
          border:       '#2A2A2A',
          surface:      '#141414',
        },
        // === Roadmap 3.1 — Semantic design system tokens ===
        // Używane via: bg-ds-bg-base, text-ds-text-primary, border-ds-border-default, etc.
        ds: {
          'bg-base':           'var(--bg-base)',
          'bg-surface':        'var(--bg-surface)',
          'bg-surface-raised': 'var(--bg-surface-raised)',
          'bg-sidebar':        'var(--bg-sidebar)',
          'border-default':    'var(--border-default)',
          'border-subtle':     'var(--border-subtle)',
          'text-primary':      'var(--text-primary)',
          'text-secondary':    'var(--text-secondary)',
          'text-muted':        'var(--text-muted)',
          'accent-amber':       'var(--accent-amber)',
          'accent-amber-light': 'var(--accent-amber-light)',  /* PR-LP-01 */
          'accent-amber-hover': 'var(--accent-amber-hover)',
          'accent-amber-subtle':'var(--accent-amber-subtle)',
          'accent-blue':       'var(--accent-blue)',
          'accent-blue-subtle':'var(--accent-blue-subtle)',
          'state-success':     'var(--state-success)',
          'state-warning':     'var(--state-warning)',
          'state-error':       'var(--state-error)',
          'state-info':        'var(--state-info)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        'token-sm':   'var(--radius-sm)',
        'token-md':   'var(--radius-md)',
        'token-lg':   'var(--radius-lg)',
        'token-xl':   'var(--radius-xl)',
        'token-full': 'var(--radius-full)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'vibrant': 'var(--shadow-vibrant)',
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'xs': 'var(--shadow-xs)',
        'amber': 'var(--shadow-amber)',
        'amber-lg': 'var(--shadow-amber-lg)',
      },
      // Premium gradient images — real amber gradients using CSS vars
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--gradient-primary-from)), hsl(var(--gradient-primary-to)))',
        'gradient-subtle': 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--primary) / 0.02))',
        'gradient-card': 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted) / 0.5))',
        'gradient-warm-surface': 'linear-gradient(180deg, hsl(36 20% 98.5%), hsl(36 15% 97%))',
        'mesh-gradient': 'none',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        // Landing page v3 animations
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        // Landing page v3 animations
        float:    'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
