/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          squid: '#232f3e',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          orange: '#ff9900',
          smile: '#ec7211',
          blue: '#0073bb',
          cyan: '#00a4e4',
          accent: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
