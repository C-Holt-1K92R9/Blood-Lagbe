/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        lifted: 'var(--raised-2)',
        line: 'var(--line)',
        strong: 'var(--text)',
        mute: 'var(--mute)',
        faint: 'var(--faint)',
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        'brand-soft': 'var(--brand-soft)',
        'brand-solid': 'var(--brand-solid)',
        'brand-solid-hover': 'var(--brand-solid-hover)',
        onbrand: 'var(--on-brand)',
        good: 'var(--good)',
        'good-soft': 'var(--good-soft)',
        amber: 'var(--amber)',
        'amber-soft': 'var(--amber-soft)',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        hero: '680px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pingRing: {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '80%, 100%': { transform: 'scale(2.1)', opacity: '0' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        rise: 'rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'ping-ring': 'pingRing 2200ms cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'float-y': 'floatY 5200ms cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
}
