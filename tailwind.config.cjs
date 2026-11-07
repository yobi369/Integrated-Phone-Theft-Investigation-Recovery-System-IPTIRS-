/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './auth/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#1a202c',
        'brand-secondary': '#2d3748',
        'brand-light': '#4a5568',
        'brand-accent': '#3b82f6',
        'brand-text': '#e2e8f0',
        'brand-text-secondary': '#a0aec0',
      },
    },
  },
  plugins: [],
};
