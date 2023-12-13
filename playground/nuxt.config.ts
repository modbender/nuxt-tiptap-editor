export default defineNuxtConfig({
  modules: ["../src/module"],
  tiptap: {
    lowlight: {
      theme: "github-dark",
    },
  },
  devtools: { enabled: true },
});
