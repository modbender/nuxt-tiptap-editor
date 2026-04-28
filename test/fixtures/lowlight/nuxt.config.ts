import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  tiptap: {
    lowlight: {
      theme: 'github-dark',
      // Example value used to assert the integrity flow wires up correctly;
      // not a real hash for the github-dark stylesheet.
      integrity: 'sha384-EXAMPLE-INTEGRITY-HASH',
    },
  },
})
