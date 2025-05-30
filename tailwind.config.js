/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour le dashboard
        'brain-blue': '#4F8EF7',
        'neural-purple': '#8B5CF6',
        'signal-green': '#10B981',
        'wave-orange': '#F59E0B',
        'dark-bg': '#111827',
        'card-bg': '#1F2937',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      fontFamily: {
        'mono': ['Fira Code', 'Monaco', 'Cascadia Code', 'Ubuntu Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}