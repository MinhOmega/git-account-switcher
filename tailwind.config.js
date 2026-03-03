/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        github: {
          green: "#2ea043",
          "green-dark": "#238636",
          "green-light": "#3fb950",
          blue: "#2f81f7",
          dark: "#0d1117",
          "dark-alt": "#161b22",
          "dark-border": "#30363d",
          gray: "#8b949e",
          "gray-dark": "#484f58",
          "gray-light": "#c9d1d9",
          white: "#f0f6fc",
        },
      },
      animation: {
        "spring-in": "spring-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "spring-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
