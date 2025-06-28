export default defineNuxtConfig({
  modules: ['../src/module', '@nuxtjs/tailwindcss'],

  devtools: { enabled: false },
  compatibilityDate: '2024-07-25',

  tiptap: {
    lowlight: {
      theme: 'github-dark',
    },
  },
})
