/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#121212',
          green: '#2CCB5A',
          cream: '#FAF5EE',
          orange: '#F4A340',
          charcoal: '#3E3E3E',
          lightGreen: '#D9F7E3'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp')
  ]
}
