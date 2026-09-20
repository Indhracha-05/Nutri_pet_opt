/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          black: "#17191c",
        },
        paper: {
          white: "#ffffff",
        },
        mist: {
          gray: "#f2f2f3",
        },
        fog: {
          white: "#fafafb",
        },
        slate: {
          gray: "#777b86",
        },
        ash: {
          gray: "#979799",
        },
        smoke: {
          gray: "#a3a6af",
        },
        blush: {
          peach: "#fbe1d1",
        },
        sienna: {
          brown: "#5d2a1a",
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Signifier', 'Georgia', 'serif'],
        signifier: ['"Source Serif 4"', 'Signifier', 'Georgia', 'serif'],
        sans: ['Inter', 'Sohne', 'system-ui', '-apple-system', 'sans-serif'],
        sohne: ['Inter', 'Sohne', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Source Code Pro"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        cards: '24px',
        elevated: '20px',
        inputs: '16px',
        images: '12px',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 0 0 1px rgba(4,23,43,0.05), 0 4px 24px 0 rgba(0,0,0,0.06)',
        floating: '0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
