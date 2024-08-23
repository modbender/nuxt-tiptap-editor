import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
  ignores: ['dist', 'node_modules'],
  rules: {
    'vue/multi-word-component-names': 0,
  },
});
