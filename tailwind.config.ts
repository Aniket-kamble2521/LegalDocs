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
          950: "#15202b", // Dim steel-blue page background
          900: "#1c2732", // Soft card container background
          850: "#22303c", // Hover background
          800: "#2b3e50", // Soft slate borders
          700: "#3d546a", // Active borders
          650: "#475569",
          600: "#64748b",
          550: "#8899a6", // Cool gray secondary labels
          500: "#cbd5e1", // Off-white readable body text
          400: "#e2e8f0", // Supporting text
          350: "#ffffff", // Heading title color
          300: "#ffffff",
          200: "#ffffff",
          100: "#ffffff",
        }
      },
    },
  },
  plugins: [],
};
export default config;
