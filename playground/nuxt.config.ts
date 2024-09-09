import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  css: ['primeicons/primeicons.css'],

  modules: ['../src/module', '@nuxtjs/tailwindcss', '@primevue/nuxt-module'],

  devtools: { enabled: true },
  compatibilityDate: '2024-07-25',

  tiptap: {
    lowlight: {
      theme: 'github-dark',
    },
  },

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
})
