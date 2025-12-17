import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  tiptap: {
    lowlight: {
      theme: 'github-dark',
    },
  },
})
