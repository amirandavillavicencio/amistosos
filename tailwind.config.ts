import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07090f',
        panel: '#111523',
        accent: '#7c5cff',
        muted: '#98a1bd'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,0.2), 0 8px 36px rgba(0,0,0,0.45)'
      }
    }
  },
  plugins: []
};

export default config;
