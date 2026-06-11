---
sidebar:
  order: 3
title: Code Block Highlighter Example
description: Enable the lowlight option for syntax-highlighted code blocks.
---

This example uses a code block with `lowlight` for syntax highlighting.

:::tip[ENABLED VIA OPTION]
`CodeBlockLowlight` and the lowlight composables are registered only when the `tiptap.lowlight` option is **not** `false`. The module default is `lowlight: false`, so set the option to turn this feature on. While it is disabled, none of the lowlight objects are imported, keeping the chunk size down.
:::

**More about the [Code Block Lowlight extension](https://tiptap.dev/docs/editor/api/nodes/code-block-lowlight).**

## Configuration

Enable lowlight in `nuxt.config.ts`. The option is either `false` or an object:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-tiptap-editor'],
  tiptap: {
    prefix: 'Tiptap',
    lowlight: {
      theme: 'github-dark', // default
      highlightJSVersion: '11.10.0', // default
      // integrity: 'sha384-...', // optional Subresource Integrity hash
    },
  },
})
```

The `lowlight` option accepts:

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `theme` | `HighlightTheme` | `'github-dark'` | The highlight.js theme used for the code-block colours. Around 249 themes are available, with editor autocomplete on the `HighlightTheme` union. |
| `highlightJSVersion` | `string` | `'11.10.0'` | The highlight.js version used to build the CDN URL. Must be a strict `major.minor.patch` semver. |
| `integrity` | `string` | — | Optional Subresource Integrity hash for the theme stylesheet. |

When enabled, the module injects a highlight.js **theme CSS `<link>`** into your app head, pointing at unpkg:

```
https://unpkg.com/@highlightjs/cdn-assets@<highlightJSVersion>/styles/<theme>.min.css
```

A few things to know:

- `highlightJSVersion` is validated against a strict `\d+\.\d+\.\d+` semver because it's interpolated into the CDN URL. A value like `'latest'` or `'11.10'` makes the module **throw at build time**.
- `integrity` is opt-in. When you supply a hash, the injected `<link>` gains `integrity` and `crossorigin="anonymous"`. SRI hashes can't be derived without a network fetch, so compute the hash for your specific `(theme, version)` pair yourself.

## Choosing a language preset

lowlight ships two language presets. The module exposes them as the composables `commonLanguages` (a curated common set) and `allLanguages` (every supported language). Pass one to `createLowlight`:

```js
const lowlight = createLowlight(commonLanguages); // common languages

// or

const lowlight = createLowlight(allLanguages); // all languages
```

:::note
These are composables, so they keep their names — they are **not** prefixed. Use `commonLanguages` / `allLanguages`, not `Tiptapcommon` / `Tiptapfull`.
:::

## Example component

Disable StarterKit's built-in `codeBlock` and register `TiptapCodeBlockLowlight` in its place.

```vue
<template>
  <div>
    <div v-if="editor">
      <button
        :disabled="!editor.can().chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >
        bold
      </button>
      <button
        :disabled="!editor.can().chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        italic
      </button>
      <button
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        code block
      </button>
      <button
        :disabled="!editor.can().chain().focus().undo().run()"
        @click="editor.chain().focus().undo().run()"
      >
        undo
      </button>
      <button
        :disabled="!editor.can().chain().focus().redo().run()"
        @click="editor.chain().focus().redo().run()"
      >
        redo
      </button>
    </div>
    <TiptapEditorContent :editor="editor" />
  </div>
</template>

<script setup>
const lowlight = createLowlight(commonLanguages);

const editor = useEditor({
  content: '<p>I\'m running Tiptap with Vue.js. 🎉</p>',
  extensions: [
    TiptapStarterKit.configure({
      codeBlock: false,
    }),
    TiptapCodeBlockLowlight.configure({ lowlight }),
  ],
});
</script>
```
