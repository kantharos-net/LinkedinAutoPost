import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f0f4ff",
        surface: "#ffffff",
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        "text-primary": "#0f172a",
        "text-secondary": "#64748b",
        border: "#dbeafe",
        "border-strong": "#bfdbfe",
        "muted": "#e2e8f0",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(37,99,235,0.06)",
        "card-hover": "0 4px 16px rgba(37,99,235,0.12)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
