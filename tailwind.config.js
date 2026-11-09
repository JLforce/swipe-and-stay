/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FBF8F0",
        foreground: "#15302A",
        card: "#FEFCF6",
        primary: { DEFAULT: "#0B6B4F", foreground: "#FBF8F0" },
        secondary: { DEFAULT: "#E6F2ED", foreground: "#1F4A3D" },
        muted: { DEFAULT: "#F2EFE6", foreground: "#5F6F69" },
        accent: "#E0703F",
        destructive: "#D23F2B",
        border: "#E4E3D3",
      },
    },
  },
  plugins: [],
};
