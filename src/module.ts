import {
  defineNuxtModule,
  addPlugin,
  addImports,
  addImportsDir,
  addComponent,
  createResolver,
  tryResolveModule,
} from "@nuxt/kit";

import { name, version } from "../package.json";

const defaultImports = [
  { name: "Editor", path: "@tiptap/vue-3" },
  { name: "useEditor", path: "@tiptap/vue-3" },
  { name: "StarterKit", path: "@tiptap/starter-kit" },
];

const defaultComponents = [
  { name: "EditorContent", path: "@tiptap/vue-3" },
  { name: "FloatingMenu", path: "@tiptap/vue-3" },
  { name: "BubbleMenu", path: "@tiptap/vue-3" },
];

// Module options TypeScript interface definition
export interface ModuleOptions {}

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
  defaults: {},
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolve("./runtime/plugin"));

    for (const obj of defaultImports) {
      addImports({
        as: obj.name,
        name: obj.name,
        from: obj.path,
      });
    }

    for (const obj of defaultComponents) {
      addComponent({
        name: obj.name,
        export: obj.name,
        filePath: obj.path,
        mode: "client",
      });
    }
  },
});
