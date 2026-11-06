import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sam: {
          blue: "#1d4ed8",
          "blue-light": "#dbeafe",
          red: "#dc2626",
          "red-light": "#fee2e2",
          green: "#16a34a",
          "green-light": "#dcfce7",
          amber: "#d97706",
          "amber-light": "#fef3c7",
        },
      },
      minHeight: {
        touch: "3rem",
      },
      fontSize: {
        base: ["1rem", { lineHeight: "1.5rem" }],
      },
    },
  },
  plugins: [],
}

export default config
