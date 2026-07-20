import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        white: "var(--white-color)",
        slate: {
          950: "#f8fafc", // Soft page background
          900: "#ffffff", // Clean card / section background
          850: "#f1f5f9", // Soft borders / panel background
          800: "#e2e8f0", // Primary borders / dividers
          700: "#cbd5e1", // Inactive borders
          650: "#94a3b8",
          600: "#64748b", // Muted labels / secondary text
          550: "#475569", // Descriptive body helper text
          500: "#334155", // Normal body text
          400: "#1e293b", // Main headings
          350: "#0f172a", // Dark titles / bold text
          300: "#090d16", // Accent text
          200: "#020617",
          100: "#000000",
        }
      },
    },
  },
  plugins: [],
};
export default config;
