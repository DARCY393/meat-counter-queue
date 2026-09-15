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
        background: "var(--background)",
        foreground: "var(--foreground)",
        cp: {
          yellow: "#FFD200",
          "yellow-deep": "#F5C518",
          red: "#E30613",
          "red-deep": "#C8102E",
          "red-dark": "#8B0A14",
        },
      },
    },
  },
  plugins: [],
};
export default config;
