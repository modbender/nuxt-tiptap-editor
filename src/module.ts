import { defineNuxtModule, addImports, addComponent } from '@nuxt/kit';

// @ts-expect-error es version
import { name, version } from '../package.json';

import type { ModuleOptions } from './types';

import * as allImports from './imports';

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
    const transpileModules = new Set<string>([]);

    let optionalImports: { [key: string]: string }[] = [];
    let optionalComponents: { [key: string]: string }[] = [];
    const customCSS: string[] = [];

    for (const obj of allImports.defaultComposables) {
      addImports({
        as: obj.name,
        name: obj.name,
        from: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    for (const obj of allImports.defaultImports) {
      addImports({
        as: `${options.prefix}${obj.name}`,
        name: obj.name,
        from: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    for (const obj of allImports.defaultComponents) {
      addComponent({
        // mode: "client",
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    if (options.lowlight !== false) {
      optionalImports = [...optionalImports, ...allImports.lowlightImports];
      const lldefaultTheme = options.lowlight?.theme || 'github-dark';
      const highlightJSVersion =
        options.lowlight?.highlightJSVersion || '11.9.0';
      const llThemeCSS = `https://unpkg.com/@highlightjs/cdn-assets@${highlightJSVersion}/styles/${lldefaultTheme}.min.css`;

      nuxt.options.app.head.link = [
        ...(nuxt.options.app.head.link || []),
        { rel: 'stylesheet', href: llThemeCSS },
      ];
    }

    // For future uses
    optionalComponents = [...optionalComponents];

    for (const obj of optionalImports) {
      addImports({
        as: `${options.prefix}${obj.name}`,
        name: obj.name,
        from: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    for (const obj of optionalComponents) {
      addComponent({
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    nuxt.options.build.transpile = [
      ...nuxt.options.build.transpile,
      ...Array.from(transpileModules),
    ];

    nuxt.options.css = [...nuxt.options.css, ...customCSS];

    console.info('Tiptap Editor initialized');
  },
});
