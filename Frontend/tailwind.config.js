/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple (IN) Token Set
        apple: {
          surface: "#D2D2D7",       // color-6
          dark: "#1D1D1F",          // color-1
          subtext: "#6E6E73",       // color-4
          blue: "#0066CC",          // color-2
          orange: "#B64400",        // color-3
          vibrant: "#FF791B",       // color-5
          white: "#FFFFFF",         // color-7
          canvas: "#000000",        // Deep Black Base
          card: "#161617",          // Apple Card Container
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontSize: {
        // Apple (IN) Typography scale
        'apple-xs': ['8px', { lineHeight: '10.8px' }],
        'apple-sm': ['12px', { lineHeight: '16px' }],
        'apple-base': ['14px', { lineHeight: '20px' }],
        'apple-lg': ['17px', { lineHeight: '22px' }],
        'apple-xl': ['20px', { lineHeight: '25px' }],
        'apple-2xl': ['28px', { lineHeight: '32px' }],
        'apple-3xl': ['44px', { lineHeight: '48px' }],
        'apple-4xl': ['80px', { lineHeight: '84px' }],
      },
      spacing: {
        // Apple (IN) Exact Spacing Grid
        'apple-1': '2px',
        'apple-2': '4px',
        'apple-3': '6px',
        'apple-4': '7px',
        'apple-5': '8px',
        'apple-6': '10px',
        'apple-7': '14px',
        'apple-8': '16px',
        'apple-9': '18px',
        'apple-10': '19px',
        'apple-11': '20px',
        'apple-12': '22px',
        'apple-13': '28px',
        'apple-14': '38px',
        'apple-15': '40px',
        'apple-16': '41px',
        'apple-17': '62px',
        'apple-18': '140px',
        'apple-19': '441px',
      },
      borderRadius: {
        // Apple (IN) Shape Tokens
        'apple-sm': '18px',
        'apple-md': '56px',
        'apple-pill': '56px',
        lg: "18px",
        md: "18px",
        sm: "12px",
        full: "56px",
      },
      boxShadow: {
        'apple-sm': 'rgba(0, 0, 0, 0.08) 2px 4px 12px 0px',
        'apple-card': '0 4px 24px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(210, 210, 215, 0.1)',
        'apple-glow': '0 0 20px -3px rgba(0, 102, 204, 0.35)',
        'apple-orange-glow': '0 0 20px -3px rgba(255, 121, 27, 0.35)',
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "SF Pro",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        'apple-base': 'cubic-bezier(0, 0, 0.5, 1)',
        'apple-slow': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'apple-spring': 'cubic-bezier(0.15, 0, 0.2, 1)',
      },
      transitionDuration: {
        'apple-fast': '100ms',
        'apple-base': '300ms',
        'apple-slow': '320ms',
        'apple-spring': '500ms',
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0, 0, 0.5, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0, 0, 0.5, 1)",
        "slide-in-right": "slideInRight 0.32s cubic-bezier(0.4, 0, 0.6, 1)",
        "modal-pop": "modalPop 0.3s cubic-bezier(0.15, 0, 0.2, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        modalPop: {
          "0%": { opacity: "0", transform: "scale(0.97) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
