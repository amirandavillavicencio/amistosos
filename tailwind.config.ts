import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f7f1e8',
        ivory: '#fffaf2',
        sand: '#efe4d3',
        line: '#ddceb8',
        ink: '#2f2419',
        muted: '#736458',
        accent: '#bb6b3f',
        copper: '#995333'
      },
      boxShadow: {
        soft: '0 16px 45px rgba(77, 56, 36, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
