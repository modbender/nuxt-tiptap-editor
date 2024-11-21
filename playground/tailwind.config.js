module.exports = {
  // ...
  content: [
    './presets/**/*.{js,vue,ts}',
    // other paths
  ],
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-primeui'),
  ],
}
