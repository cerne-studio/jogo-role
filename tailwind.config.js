/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: '#0a0a0b',
        surface: '#111113',
        elevated: '#1a1a1f',
        border: 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.15)',
        primary: '#f0f0f2',
        secondary: '#8b8b9a',
        muted: '#5a5a6a',
        accent: '#f59e0b',
        'accent-glow': 'rgba(245,158,11,0.25)',
        success: '#10b981',
        danger: '#ef4444',
      },
      boxShadow: {
        glow: '0 0 40px -8px var(--tw-shadow-color)',
      },
    },
  },
  plugins: [],
}
