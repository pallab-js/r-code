import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3ecf8e',
          link: '#00c573',
          border: 'rgba(62, 207, 142, 0.3)',
        },
        cursor: {
          dark: '#fafafa',
          cream: '#b4b4b4',
          light: '#898989',
          orange: '#3ecf8e',
          gold: '#d4964a',
          error: '#cf2d56',
          success: '#3ecf8e',
        },
        surface: {
          100: '#0f0f0f',
          200: '#171717',
          300: '#2e2e2e',
          400: '#363636',
          500: '#393939',
        },
        timeline: {
          thinking: '#e8b89e',
          grep: '#8dbf8a',
          read: '#8eb8e8',
          edit: '#b88de8',
        },
        border: {
          subtle: '#242424',
          primary: '#2e2e2e',
          medium: '#363636',
          strong: '#393939',
        },
      },
      fontFamily: {
        circular: ['Circular', 'custom-font', 'Helvetica Neue', 'Helvetica', 'Arial'],
        mono: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New'],
        system: ['system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial'],
      },
      fontSize: {
        'display-hero': ['72px', { lineHeight: '1.00', letterSpacing: 'normal', fontWeight: '400' }],
        'section-heading': ['36px', { lineHeight: '1.25', letterSpacing: 'normal', fontWeight: '400' }],
        'card-title': ['24px', { lineHeight: '1.33', letterSpacing: '-0.16px', fontWeight: '400' }],
        'sub-heading': ['18px', { lineHeight: '1.56', letterSpacing: 'normal', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.50', letterSpacing: 'normal', fontWeight: '400' }],
        'nav': ['14px', { lineHeight: '1.43', letterSpacing: 'normal', fontWeight: '500' }],
        'button': ['14px', { lineHeight: '1.14', letterSpacing: 'normal', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '1.43', letterSpacing: 'normal', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.33', letterSpacing: 'normal', fontWeight: '400' }],
        'code-label': ['12px', { lineHeight: '1.33', letterSpacing: '1.2px', fontWeight: '400' }],
        'mono-body': ['14px', { lineHeight: '1.60', letterSpacing: 'normal', fontWeight: '400' }],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'micro': '1.5px',
        'sm': '2px',
        'md': '3px',
        'DEFAULT': '6px',
        'lg': '8px',
        'xl': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'focus': 'rgba(0,0,0,0.1) 0px 4px 12px',
      },
    },
  },
  plugins: [],
}
export default config
