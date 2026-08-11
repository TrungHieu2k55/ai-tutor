/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Bảng màu đồng bộ với thiết kế Figma "tech blue, trustworthy"
        navy: "#0E1B2E",
        accent: "#2F6FED",
        bg: "#F3F6FB",
        border: "#DCE3EE",
        muted: "#6B7A90",
        ink: "#1A2233",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
