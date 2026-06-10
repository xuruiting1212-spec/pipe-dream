/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dream: {
          50: '#fce4ec',   // 最浅粉 - 背景
          100: '#f8bbd0',
          200: '#f48fb1',
          300: '#f06292',
          400: '#ec407a',
          500: '#e91e63',  // 主色 - 玫瑰红
          600: '#d81b60',
          700: '#c2185b',
          800: '#ad1457',
          900: '#880e4f',
        },
        purple: {
          50: '#f3e5f5',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#9c27b0',  // 辅色 - 紫罗兰
          600: '#8e24aa',
          700: '#7b1fa2',
          800: '#6a1b9a',
          900: '#4a148c',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Noto Serif SC"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'dream': '16px',
        'dream-sm': '10px',
        'dream-lg': '24px',
      },
      boxShadow: {
        'dream': '0 4px 20px rgba(233, 30, 99, 0.12)',
        'dream-lg': '0 8px 32px rgba(156, 39, 176, 0.15)',
        'dream-sm': '0 2px 8px rgba(233, 30, 99, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
