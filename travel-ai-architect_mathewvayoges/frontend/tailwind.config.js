/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: { 
    extend: {
      colors: {
        navy: "#0B1B2B",
        offwhite: "#F5EFE6",
        gold: "#A78BFA",
        teal: "#2A9D8F",
      },
      fontFamily: {
        serif: ["dm-serif-display", "serif"],
        sans: ["outfit", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      }
    } 
  },
  plugins: [],
};
