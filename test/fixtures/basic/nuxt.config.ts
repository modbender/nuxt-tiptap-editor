import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  },
})
