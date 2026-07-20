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
        white: "#ffffff",
        slate: {
          950: "#0b111e", // Premium soft dark page background
          900: "#131926", // Card / section background (glassmorphic contrast)
          850: "#1b2336", // Soft hover background
          800: "#222c42", // Primary borders / dividers
          700: "#2d3a57", // Active borders
          650: "#475569",
          600: "#64748b",
          550: "#94a3b8", // Muted labels / secondary text
          500: "#cbd5e1", // Normal body text (off-white for high contrast)
          400: "#e2e8f0", // Descriptive body helper text
          350: "#f8fafc", // Main headings
          300: "#ffffff", // Pure white for accent text
          200: "#ffffff",
          100: "#ffffff",
        }
      },
    },
  },
  plugins: [],
};
export default config;
