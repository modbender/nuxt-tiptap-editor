import type { ImportObject } from '../types'

export const lowlightComposables: ImportObject[] = [
  { name: 'all', as: 'allLanguages', path: 'lowlight' },
  { name: 'common', as: 'commonLanguages', path: 'lowlight' },
  { name: 'createLowlight', path: 'lowlight' },
]

export const lowlightImports: ImportObject[] = [
  {
    name: 'CodeBlockLowlight',
    path: '@tiptap/extension-code-block-lowlight',
  },
]

export const placeholderImports: ImportObject[] = [
  {
    name: 'Placeholder',
    path: 'components/nuxt-stubs',
    local: true,
  },
]
