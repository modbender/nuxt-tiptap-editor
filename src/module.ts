import { defineNuxtModule, addImports, addComponent } from "@nuxt/kit";

import { name, version } from "../package.json";

import type { ModuleOptions } from "./types";

import * as allImports from "./imports";

// Module options TypeScript interface definition

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: "tiptap",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    prefix: "Tiptap",
    lowlight: false,
  },
  async setup(options, nuxt) {
    // const { resolve } = createResolver(import.meta.url);

    const transpileModules = new Set<string>([]);

    let optionalImports: { [key: string]: any }[] = [];
    let optionalComponents: { [key: string]: any }[] = [];
    const customCSS: string[] = [];

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
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
        mode: "client",
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    if (options.lowlight !== false) {
      optionalImports = [...optionalImports, ...allImports.lowlightImports];
      const lldefaultTheme = options.lowlight?.theme || "github-dark";
      const highlightJSVersion =
        options.lowlight?.highlightJSVersion || "11.9.0";
      const llThemeCSS = `https://unpkg.com/@highlightjs/cdn-assets@${highlightJSVersion}/styles/${lldefaultTheme}.min.css`;

      nuxt.options.app.head.link = [
        ...(nuxt.options.app.head.link || []),
        { rel: "stylesheet", href: llThemeCSS },
      ];
    }

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
        mode: "client",
        name: `${options.prefix}${obj.name}`,
        export: obj.name,
        filePath: obj.path,
        // _internal_install: obj.path,
      });
      transpileModules.add(obj.path);
    }

    nuxt.options.build.transpile = [
      ...nuxt.options.build.transpile,
      ...transpileModules,
    ];

    nuxt.options.css = [...nuxt.options.css, ...customCSS];

    console.log("Tiptap Editor initialized");
  },
});
