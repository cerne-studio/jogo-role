/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#101114',
        surface: '#1b1d22',
        elevated: '#24262d',
        border: 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.15)',
        primary: '#f4f2ed',
        secondary: '#8b8b9a',
        muted: '#5a5a6a',
        accent: '#ffba38',
        'accent-glow': 'rgba(255,186,56,0.22)',
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
