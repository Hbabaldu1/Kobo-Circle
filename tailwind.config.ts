import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
theme: {
    extend: {
      colors: { ink: '#1B1F3B', adire: '#2F4B7C', paper: '#F6F1E7', ochre: '#D9A441' },
      fontFamily: { sans: ['var(--font-inter)', 'sans-serif'], heading: ['var(--font-space-grotesk)', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
