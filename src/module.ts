import {
  defineNuxtModule,
  addImports,
  addComponent,
  createResolver,
} from '@nuxt/kit'

import { name, version } from '../package.json'

import type { ModuleOptions, ImportObject } from './types'

import * as allImports from './imports'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'tiptap',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    prefix: 'Tiptap',
    lowlight: false,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const transpileModules = new Set<string>([])

    const defaultComposables: ImportObject[] = [
      ...allImports.defaultComposables,
    ]

    const defaultImports: ImportObject[] = [...allImports.defaultImports]

    const defaultComponents: ImportObject[] = [...allImports.defaultComponents]

    const optionalImports: ImportObject[] = []
    const optionalComposables: ImportObject[] = []
    const optionalComponents: ImportObject[] = []

    const customComposables: ImportObject[] = [...allImports.customComposables]
    const customImports: ImportObject[] = [...allImports.customImports]
    const customComponents: ImportObject[] = [...allImports.customComponents]

    const customCSS: string[] = []

    for (const obj of defaultComposables) {
      addImports({
        as: obj.as || obj.name,
        name: obj.name,
        from: obj.path,
      })
      transpileModules.add(obj.path)
    }

    for (const obj of defaultImports) {
      addImports({
        as: `${options.prefix}${obj.name}`,
        name: obj.name,
        from: obj.path,
      })
      transpileModules.add(obj.path)
    }

    for (const obj of defaultComponents) {
      addComponent({
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
      })
      transpileModules.add(obj.path)
    }

    // Optional imports and components
    if (options.lowlight !== false) {
      optionalImports.push(...allImports.lowlightImports)
      optionalComposables.push(...allImports.lowlightComposables)

      const lldefaultTheme = options.lowlight?.theme || 'github-dark'
      const highlightJSVersion
        = options.lowlight?.highlightJSVersion || '11.10.0'
      const llThemeCSS = `https://unpkg.com/@highlightjs/cdn-assets@${highlightJSVersion}/styles/${lldefaultTheme}.min.css`

      nuxt.options.app.head.link = [
        ...(nuxt.options.app.head.link || []),
        { rel: 'stylesheet', href: llThemeCSS },
      ]
    }

    for (const obj of optionalImports) {
      addImports({
        as: `${options.prefix}${obj.name}`,
        name: obj.name,
        from: obj.path,
      })
      transpileModules.add(obj.path)
    }

    for (const obj of optionalComposables) {
      addImports({
        as: obj.as || obj.name,
        name: obj.name,
        from: obj.path,
      })
      transpileModules.add(obj.path)
    }

    for (const obj of optionalComponents) {
      addComponent({
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
      })
      transpileModules.add(obj.path)
    }

    for (const obj of customImports) {
      addImports({
        as: `${options.prefix}${obj.name}`,
        name: obj.name,
        from: resolver.resolve(obj.path),
      })
    }

    for (const obj of customComposables) {
      addImports({
        as: obj.as || obj.name,
        name: obj.name,
        from: resolver.resolve(obj.path),
      })
    }

    for (const obj of customComponents) {
      addComponent({
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: resolver.resolve(obj.path),
      })
    }

    nuxt.options.build.transpile = [
      ...nuxt.options.build.transpile,
      ...Array.from(transpileModules),
    ]

    nuxt.options.css = [...nuxt.options.css, ...customCSS]

    nuxt.options.typescript = nuxt.options.typescript || {}
    nuxt.options.typescript.hoist = nuxt.options.typescript.hoist || []
    nuxt.options.typescript.hoist.push('@tiptap/vue-3')

    console.info('Tiptap Editor initialized')
  },
})
