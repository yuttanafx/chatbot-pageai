/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B19",
        paper: "#FAF8F4",
        moss: "#3F5B45",
        clay: "#B5562A",
        line: "#E4DFD3",
      },
      fontFamily: {
        display: ["'Spectral'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
