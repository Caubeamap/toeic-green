import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        growth: "#8ef588",
        "growth-dark": "#007a22",
        "academic-blue": "#10235f",
        ink: "#111817",
        muted: "#647067",
        frost: "#f8fbf7",
        "soft-mint": "#eafdea",
        "mist-blue": "#dde7ff",
        danger: "#dc2626"
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "Inter", "sans-serif"]
      },
      boxShadow: {
        glass: "0 24px 70px rgba(16, 35, 95, 0.10)",
        glow: "0 18px 44px rgba(142, 245, 136, 0.34)",
        soft: "0 16px 40px rgba(17, 24, 23, 0.08)"
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
