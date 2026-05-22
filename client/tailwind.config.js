/*client/tailwind.config.js*/

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand:       "#ceab11",  // color de marca — cambia aquí
        "brand-hover":  "#b08d47",
        "brand-light":  "#e8d9b8",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
  safelist: [
    "hover:bg-purple-400",
    "hover:bg-emerald-300",
    "hover:bg-pink-500",
    "hover:bg-amber-400",

    "hover:bg-amber-400",
    "hover:bg-red-700",
     "hover:bg-yellow-400",
     "hover:bg-amber-600",
    // todos los que uses
  ],
}