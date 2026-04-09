import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#eef3f6',
        ivory: '#fdfcf9',
        sand: '#e5edf3',
        line: '#cfdae4',
        ink: '#1f3342',
        muted: '#5f7384',
        accent: '#1f4d79',
        copper: '#173c5e'
      },
      boxShadow: {
        soft: '0 18px 42px rgba(31, 51, 66, 0.10)'
      }
    }
  },
  plugins: []
};

export default config;
