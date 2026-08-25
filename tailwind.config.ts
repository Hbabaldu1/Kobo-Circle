import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
theme: {
    extend: {
      colors: { ink: '#1B1F3B', adire: '#2F4B7C', paper: '#F6F1E7', ochre: '#D9A441', brick: '#B23A2E', leaf: '#4C7A5E' },
      fontFamily: { sans: ['var(--font-inter)', 'sans-serif'], heading: ['var(--font-space-grotesk)', 'sans-serif'], mono: ['var(--font-jetbrains-mono)', 'monospace'] },
    },
  },
  plugins: [],
};

export default config;
