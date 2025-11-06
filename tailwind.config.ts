import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        court: {
          bg: '#faf7f2',
          brown: '#5a4632',
          beige: '#e8dcc7',
        },
      },
      fontFamily: {
        serif: ['Lora', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}

export default config


