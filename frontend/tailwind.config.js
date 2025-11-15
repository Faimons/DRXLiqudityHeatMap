/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0a',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
        },
        trading: {
          bid: '#00ff00',
          ask: '#ff0000',
          neutral: '#ffff00',
        },
        chart: {
          up: '#26a69a',
          down: '#ef5350',
          grid: '#1e1e1e',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
