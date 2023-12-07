import { defineNuxtModule, addImports, addComponent } from "@nuxt/kit";

import { name, version } from "../package.json";

import * as allImports from "./imports";

// Module options TypeScript interface definition

export interface ModuleOptions {
  /**
   * Determine if lowlight should be enabled
   *
   * @default false
   */
  lowlight?:
    | boolean
    | {
        /**
         * Determine if lowlight should be enabled
         *
         * @default false
         */
        enabled: boolean;
        /**
         * Languages to be loaded for highlighting
         *
         */
        languages: string[];
      };
}

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
    lowlight: false,
  },
  async setup(options, nuxt) {
    // const { resolve } = createResolver(import.meta.url);

    nuxt.options.build.transpile.push("@tiptap/vue-3");
    nuxt.options.build.transpile.push("@tiptap/starter-kit");
    nuxt.options.build.transpile.push("@tiptap/pm");

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`

    for (const obj of allImports.defaultImports) {
      addImports({
        as: obj.name,
        name: obj.name,
        from: obj.path,
        // _internal_install: obj.path,
      });
    }

    for (const obj of allImports.defaultComponents) {
      addComponent({
        mode: "client",
        name: obj.name,
        export: obj.name,
        filePath: obj.path,
        // _internal_install: obj.path,
      });
    }

    if (options.lowlight === false) {
      allImports.optionalImports.push(...allImports.lowlightImports);
    }

    for (const obj of allImports.optionalImports) {
      addImports({
        as: obj.name,
        name: obj.name,
        from: obj.path,
        // _internal_install: obj.path,
      });
    }
  },
});
