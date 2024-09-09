import path from 'node:path'
import type { ImportObject } from '../types'

const customExtensionPath = '../custom-extensions'
const resolveCustomExtension = (extPath: string) =>
  path.resolve(__dirname, customExtensionPath, extPath)

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
