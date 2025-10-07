/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./apps/renderer/**/*.{js,ts,jsx,tsx}",
    "./packages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'agent-purple': '#8B5CF6',
        'agent-blue': '#3B82F6',
        'agent-dark': '#1F2937',
        'agent-darker': '#111827'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite'
      }
    },
  },
  plugins: [],
}
