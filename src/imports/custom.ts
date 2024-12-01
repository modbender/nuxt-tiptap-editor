import type { ImportObject } from '../types'

const customExtensionPath = 'runtime/custom-extensions'
const resolveCustomExtension = (extPath: string) =>
  `${customExtensionPath}/${extPath}`

export const defaultCustomExtensions: ImportObject[] = [
  {
    name: 'ImageUpload',
    path: resolveCustomExtension('extension-image-upload'),
  },
  {
    name: 'ImagePlaceholder',
    path: resolveCustomExtension('extension-image-upload'),
  },
]

export const customImports: ImportObject[] = [...defaultCustomExtensions]

export const customComposables: ImportObject[] = []

export const customComponents: ImportObject[] = []
