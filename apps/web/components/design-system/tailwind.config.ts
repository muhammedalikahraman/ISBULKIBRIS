import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Color Harmony System - 60-30-10 Rule
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#E8983E", // Main brand color - Cyprus sunset
          600: "#D47828",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
          gradient: "linear-gradient(135deg, #E8983E 0%, #FDBA74 50%, #FFEDD5 100%)",
          gradientDark: "linear-gradient(135deg, #D47828 0%, #B45309 50%, #92400E 100%)",
        },
        secondary: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#2C7A7B", // Mediterranean sea
          600: "#236566",
          700: "#1E4F50",
          800: "#194041",
          900: "#153335",
          950: "#0E2123",
          gradient: "linear-gradient(135deg, #2C7A7B 0%, #2DD4BF 50%, #5EEAD4 100%)",
        },
        accent: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED", // Modern AI accent
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3E1A75",
          950: "#2E1065",
          gradient: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #C4B5FD 100%)",
        },
        neutral: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
        surface: {
          light: "#FFFBF5", // Warm white
          cream: "#FEF3C7", // Subtle warmth
          accent: "#FEF9C3", // Soft accent
          elevated: "#FFFFFF",
          glass: "rgba(255, 255, 255, 0.7)",
          glassDark: "rgba(15, 23, 42, 0.7)",
        },
        semantic: {
          success: {
            DEFAULT: "#10B981",
            gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
          },
          warning: {
            DEFAULT: "#F59E0B",
            gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
          },
          error: {
            DEFAULT: "#EF4444",
            gradient: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
          },
          info: {
            DEFAULT: "#3B82F6",
            gradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
          },
        },
      },
      fontFamily: {
        display: ["Inter Variable", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "hero": "clamp(32px, 5vw, 64px)",
        "heading": "clamp(24px, 3vw, 48px)",
        "subheading": "clamp(18px, 2vw, 32px)",
        "body": "clamp(14px, 1vw, 18px)",
      },
      animation: {
        // Professional Animation System
        "gradient-x": "gradient-x 8s ease infinite",
        "gradient-y": "gradient-y 8s ease infinite",
        "gradient-xy": "gradient-xy 12s ease infinite",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-in-up": "fadeInUp 0.8s ease-out",
        "fade-in-down": "fadeInDown 0.8s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "slide-left": "slideLeft 0.5s ease-out",
        "slide-right": "slideRight 0.5s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
        "scale-out": "scaleOut 0.4s ease-out",
        "rotate-in": "rotateIn 0.6s ease-out",
        "bounce-in": "bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 2.5s infinite",
        "ripple": "ripple 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float-glow": "floatGlow 4s ease-in-out infinite",
        "particle": "particle 15s linear infinite",
        "morph": "morph 8s ease-in-out infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "0% 50%",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "100% 50%",
          },
        },
        "gradient-y": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "50% 0%",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "50% 100%",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "0% 50%",
          },
          "50%": {
            "background-size": "400% 400%",
            "background-position": "100% 50%",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        rotateIn: {
          "0%": { transform: "rotate(-180deg) scale(0)", opacity: "0" },
          "100%": { transform: "rotate(0deg) scale(1)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(232, 152, 62, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(232, 152, 62, 0.8), 0 0 30px rgba(232, 152, 62, 0.6)" },
        },
        floatGlow: {
          "0%, 100%": {
            transform: "translateY(0px)",
            boxShadow: "0 0 15px rgba(232, 152, 62, 0.3)",
          },
          "50%": {
            transform: "translateY(-15px)",
            boxShadow: "0 0 25px rgba(232, 152, 62, 0.5)",
          },
        },
        particle: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-1000px) rotate(720deg)", opacity: "0" },
        },
        morph: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
      },
      spacing: {
        "128": "32rem",
        "144": "36rem",
        "160": "40rem",
        "192": "48rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        // Advanced Shadow System
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
        "elevated": "0 20px 40px rgba(0, 0, 0, 0.08)",
        "floating": "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        "primary-glow": "0 0 30px rgba(232, 152, 62, 0.4), 0 0 60px rgba(232, 152, 62, 0.2)",
        "secondary-glow": "0 0 30px rgba(44, 122, 123, 0.4), 0 0 60px rgba(44, 122, 123, 0.2)",
        "accent-glow": "0 0 30px rgba(124, 58, 237, 0.4), 0 0 60px rgba(124, 58, 237, 0.2)",
        "ai-glow": "0 0 20px rgba(124, 58, 237, 0.3), 0 0 40px rgba(124, 58, 237, 0.2)",
        "success-glow": "0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)",
        "neon-primary": "0 0 10px rgba(232, 152, 62, 0.8), 0 0 20px rgba(232, 152, 62, 0.6), 0 0 30px rgba(232, 152, 62, 0.4)",
        "neon-secondary": "0 0 10px rgba(44, 122, 123, 0.8), 0 0 20px rgba(44, 122, 123, 0.6), 0 0 30px rgba(44, 122, 123, 0.4)",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-light": "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
      },
      backdropBlur: {
        "xs": "2px",
        "sm": "4px",
        "DEFAULT": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "24px",
        "2xl": "40px",
        "3xl": "64px",
      },
    },
  },
  plugins: [],
};

export default config;