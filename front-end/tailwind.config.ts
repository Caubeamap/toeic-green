import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#006e19",
        "on-primary": "#ffffff",
        "primary-container": "#8ef588",
        "on-primary-container": "#00721a",
        "primary-fixed": "#93fa8c",
        "primary-fixed-dim": "#77dd73",
        "on-primary-fixed-variant": "#005310",
        secondary: "#4b5a9e",
        "on-secondary": "#ffffff",
        "secondary-container": "#a6b5ff",
        "on-secondary-container": "#354487",
        "secondary-fixed": "#dde1ff",
        tertiary: "#5c5f60",
        "tertiary-container": "#dddedf",
        "on-tertiary-container": "#5f6263",
        surface: "#fbf9f8",
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#3f4a3c",
        "surface-container": "#f0eded",
        "surface-container-low": "#f6f3f2",
        "surface-container-highest": "#e4e2e1",
        "outline-variant": "#becab8",
        background: "#fbf9f8",
        growth: "#8ef588",
        "growth-dark": "#006e19",
        "academic-blue": "#4b5a9e",
        ink: "#1b1c1c",
        muted: "#3f4a3c",
        frost: "#fbf9f8"
      },
      fontSize: {
        "display-lg": ["42px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "800" }],
        "headline-lg": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "1.35", fontWeight: "700" }],
        "body-lg": ["17px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "1.2", fontWeight: "700" }]
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "Inter", "sans-serif"]
      },
      fontWeight: {
        black: "800",
        extrabold: "700",
        bold: "700"
      },
      maxWidth: {
        "container-max": "1280px"
      },
      spacing: {
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        gutter: "24px"
      },
      boxShadow: {
        glass: "0 8px 22px rgba(17, 24, 23, 0.06)",
        glow: "0 8px 18px rgba(0, 110, 25, 0.14)",
        soft: "0 8px 20px rgba(17, 24, 23, 0.06)"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
