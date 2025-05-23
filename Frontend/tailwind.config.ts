import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#3F3F46",       // Zinc-700
        input: "#3F3F46",        // Zinc-700
        ring: "#8B5CF6",         // Violet-500
        background: "#18181B",   // Zinc-900
        foreground: "#E4E4E7",   // Zinc-200
        primary: {
          DEFAULT: "#8B5CF6",    // Violet-500
          foreground: "#FFFFFF", // White
        },
        secondary: {
          DEFAULT: "#3F3F46",    // Zinc-700
          foreground: "#E4E4E7", // Zinc-200
        },
        destructive: {
          DEFAULT: "#EF4444",    // Red-500
          foreground: "#FFFFFF", // White
        },
        muted: {
          DEFAULT: "#27272A",    // Zinc-800
          foreground: "#A1A1AA", // Zinc-400
        },
        accent: {
          DEFAULT: "#7C3AED",    // Violet-600
          foreground: "#FFFFFF", // White
        },
        popover: {
          DEFAULT: "#27272A",    // Zinc-800
          foreground: "#E4E4E7", // Zinc-200
        },
        card: {
          DEFAULT: "#27272A",    // Zinc-800
          foreground: "#E4E4E7", // Zinc-200
        },
        // Keep previous color groups but update with new dark palette
        modern: {
          50: "#27272A",        // Zinc-800
          100: "#18181B",       // Zinc-900
          200: "#3F3F46",       // Zinc-700
          300: "#A1A1AA",       // Zinc-400
          400: "#E4E4E7",       // Zinc-200
          500: "#FFFFFF",       // White
          blue: "#8B5CF6",      // Violet-500
          teal: "#7C3AED",      // Violet-600
          green: "#10B981",     // Emerald-500
          red: "#EF4444",       // Red-500
          purple: "#A78BFA",    // Violet-400
        },
        // Update existing colors to match new theme
        luxury: {
          50: "#18181B",        // Zinc-900
          100: "#27272A",       // Zinc-800
          200: "#3F3F46",       // Zinc-700
          300: "#A1A1AA",       // Zinc-400
          400: "#E4E4E7",       // Zinc-200
          500: "#FFFFFF",       // White
          accent: "#A78BFA",    // Violet-400
        },
        warm: {
          50: "#18181B",        // Zinc-900
          100: "#A78BFA",       // Violet-400
          200: "#8B5CF6",       // Violet-500
          300: "#EF4444",       // Red-500
        },
        cyber: {
          "dark": "#18181B",       // Zinc-900
          "dark-blue": "#27272A",  // Zinc-800
          "blue": "#8B5CF6",       // Violet-500
          "teal": "#7C3AED",       // Violet-600
          "green": "#10B981",      // Emerald-500
          "red": "#EF4444",        // Red-500
          "purple": "#A78BFA",     // Violet-400
          "gray": "#A1A1AA",       // Zinc-400
          "black": "#09090B",      // Zinc-950
          "light": "#E4E4E7",      // Zinc-200
        },
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #18181B 0%, #8B5CF6 100%)',
        'cyber-gradient': 'linear-gradient(to right, #18181B, #27272A)',
        'blue-gradient': 'linear-gradient(135deg, #27272A 0%, #8B5CF6 100%)',
        'green-gradient': 'linear-gradient(135deg, #18181B 0%, #7C3AED 50%)',
        'light-gradient': 'linear-gradient(to right, #27272A, #3F3F46)',
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'elegant': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'warm-subtle': '0 4px 6px -1px rgba(139, 92, 246, 0.2), 0 2px 4px -1px rgba(139, 92, 246, 0.1)',
        'blue-glow': '0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.2)',
        'green-glow': '0 0 10px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.2)',
      },
      keyframes: {
        "fade-in": {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        "slide-up": {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        "scan-line": {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        "glitch": {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' }
        },
        "pulse-glow": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scan-line": "scan-line 4s linear infinite",
        "glitch": "glitch 0.5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite"
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#E4E4E7', // Match foreground color
            a: {
              color: '#8B5CF6', // Terracotta (primary)
              '&:hover': {
                color: '#EF4444', // Brick Red
              },
            },
            h1: {
              color: '#FFFFFF', // White for dark background
            },
            h2: {
              color: '#FFFFFF', // White for dark background
            },
            h3: {
              color: '#FFFFFF', // White for dark background
            },
            h4: {
              color: '#FFFFFF', // White for dark background
            },
            code: {
              color: '#EF4444', // Brick Red
              backgroundColor: '#18181B', // Dark background
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            pre: {
              backgroundColor: '#18181B', // Dark background
              code: {
                backgroundColor: 'transparent',
              },
            },
          },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
} satisfies Config;
