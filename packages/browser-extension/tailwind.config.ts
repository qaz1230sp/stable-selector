import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: '#1e1e2e',
          surface: '#2a2a3e',
          border: '#3a3a4e',
          text: '#e0e0e0',
          muted: '#8888aa',
          accent: '#4A90D2',
          success: '#8CC84B',
          warning: '#F5A623',
          danger: '#E74C3C',
        },
      },
      fontSize: {
        'xxs': '0.65rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
