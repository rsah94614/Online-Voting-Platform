/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#060611',
          bg2: '#0a0a1a',
          bg3: '#0e0e24',
          cyan: '#00d4ff',
          cyan2: '#00a8cc',
          purple: '#7c3aed',
          purple2: '#5b21b6',
          pink: '#ff2d6a',
          green: '#00ff88',
          amber: '#f59e0b',
          text: '#e2e8f0',
          muted: '#94a3b8',
          dim: '#475569',
        }
      },
      borderRadius: {
        'radius': '12px',
        'radius-lg': '20px',
      },
    },
  },
  plugins: [],
}
