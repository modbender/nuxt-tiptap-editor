export default defineNuxtConfig({
  modules: ["../src/module"],

  tiptap: {
    lowlight: {
      theme: "github-dark",
    },
  },

  devtools: { enabled: true },
  compatibilityDate: "2024-07-25",
});