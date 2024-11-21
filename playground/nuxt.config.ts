import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  modules: ['../src/module', '@nuxtjs/tailwindcss', '@primevue/nuxt-module'],

  devtools: { enabled: true },
  css: ['primeicons/primeicons.css'],
  compatibilityDate: '2024-07-25',

  primevue: {
    components: {
      exclude: ['Chart', 'Editor'],
    },
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
      ripple: true,
    },
  },

  tiptap: {
    lowlight: {
      theme: 'github-dark',
    },
  },
})
