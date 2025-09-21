/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dateien, in denen Tailwind nach Klassen sucht
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],

  // Dark Mode Steuerung: 'media' (System) oder 'class' (per Klasse)
  darkMode: "class", // oder "media"

  theme: {
    extend: {}, // hier kannst du Farben, Fonts usw. erweitern
  },
  plugins: [],
};
