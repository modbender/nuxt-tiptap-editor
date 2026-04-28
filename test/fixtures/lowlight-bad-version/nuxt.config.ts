import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  tiptap: {
    lowlight: {
      theme: 'github-dark',
      // Deliberately invalid — the module should refuse to set up.
      highlightJSVersion: 'not-a-version',
    },
  },
})
