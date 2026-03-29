/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "system-ui", "sans-serif"],
        sans:   ["DM Sans", "system-ui", "sans-serif"],
      },
      fontWeight: {
        800: "800",
        900: "900",
      },
      colors: {
        teal: {
          50:  "#f0fdf8",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        saffron: {
          100: "#fef0dc",
          300: "#fbb060",
          400: "#f59335",
          500: "#e87422",
          600: "#c2600a",
        },
        ink: {
          50:  "#f2f6fa",
          100: "#e5edf5",
          200: "#c8d7e5",
          300: "#a0b3c8",
          400: "#7a8fa6",
          500: "#566880",
          600: "#3e5168",
          700: "#2a3547",
          800: "#182030",
          900: "#0c1420",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
      boxShadow: {
        teal: "0 8px 32px rgba(15,158,135,0.22)",
        "teal-lg": "0 12px 40px rgba(15,158,135,0.30)",
        card: "0 1px 3px rgba(12,20,32,0.08), 0 1px 2px rgba(12,20,32,0.04)",
        "card-hover": "0 12px 40px rgba(12,20,32,0.14), 0 4px 8px rgba(12,20,32,0.08)",
      },
      animation: {
        "fade-in-up":   "fadeInUp 0.5s ease-out both",
        "fade-in":      "fadeIn 0.4s ease-out",
        "slide-down":   "slideDown 0.25s ease-out",
        "pulse-dot":    "pulseDot 1.8s ease-in-out infinite",
        shimmer:        "shimmer 1.4s infinite",
      },
      keyframes: {
        fadeInUp:  { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideDown: { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseDot:  { "0%, 100%": { transform: "scale(1)", opacity: 1 }, "50%": { transform: "scale(1.4)", opacity: 0.7 } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
