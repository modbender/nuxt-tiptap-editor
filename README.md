<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: Nuxt TipTap Editor
- Package name: nuxt-tiptap-editor
- Description: Essentials to Quickly Integrate TipTap Editor into your Nuxt App
-->

# Nuxt TipTap Editor

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Instantly add [TipTap Editor](https://tiptap.dev/editor) with basic functionality to your Nuxt 3 App.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🏀 Online playground](https://stackblitz.com/github/modbender/nuxt-tiptap-editor?file=playground%2Fapp.vue)
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

- 🔆Easy to integrate
- ⚡️Instantly usable components

## Quick Setup

1. Add `nuxt-tiptap-editor` dependency to your project

   ```bash
   # Using pnpm
   pnpm add -D nuxt-tiptap-editor

   # Using yarn
   yarn add --dev nuxt-tiptap-editor

   # Using npm
   npm install --save-dev nuxt-tiptap-editor
   ```

2. Add `nuxt-tiptap-editor` to the `modules` section of `nuxt.config.ts`

   ```js
   export default defineNuxtConfig({
     modules: ["nuxt-tiptap-editor"],
     tiptap: {
       prefix: "Tiptap", //prefix for Tiptap imports, composables not included
     },
   });
   ```

3. You can use the contents of this file as reference [TipTap.client.vue](/playground/components/TipTap.client.vue). Copy the code to your own `components/TipTap.client.vue`. Any path is fine as long as it's under `components` directory with `.client.vue` extension.

   ```xhtml
   <template>
     <div>
       <div v-if="editor">
         <button
           @click="editor.chain().focus().toggleBold().run()"
           :disabled="!editor.can().chain().focus().toggleBold().run()"
           :class="{ 'is-active': editor.isActive('bold') }"
         >
           bold
         </button>
         <button
           @click="editor.chain().focus().toggleItalic().run()"
           :disabled="!editor.can().chain().focus().toggleItalic().run()"
           :class="{ 'is-active': editor.isActive('italic') }"
         >
           italic
         </button>
         <button
           @click="editor.chain().focus().toggleStrike().run()"
           :disabled="!editor.can().chain().focus().toggleStrike().run()"
           :class="{ 'is-active': editor.isActive('strike') }"
         >
           strike
         </button>
         <button
           @click="editor.chain().focus().toggleCode().run()"
           :disabled="!editor.can().chain().focus().toggleCode().run()"
           :class="{ 'is-active': editor.isActive('code') }"
         >
           code
         </button>
         <button @click="editor.chain().focus().unsetAllMarks().run()">
           clear marks
         </button>
         <button @click="editor.chain().focus().clearNodes().run()">
           clear nodes
         </button>
         <button
           @click="editor.chain().focus().setParagraph().run()"
           :class="{ 'is-active': editor.isActive('paragraph') }"
         >
           paragraph
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
         >
           h1
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
         >
           h2
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
         >
           h3
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }"
         >
           h4
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 5 }) }"
         >
           h5
         </button>
         <button
           @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
           :class="{ 'is-active': editor.isActive('heading', { level: 6 }) }"
         >
           h6
         </button>
         <button
           @click="editor.chain().focus().toggleBulletList().run()"
           :class="{ 'is-active': editor.isActive('bulletList') }"
         >
           bullet list
         </button>
         <button
           @click="editor.chain().focus().toggleOrderedList().run()"
           :class="{ 'is-active': editor.isActive('orderedList') }"
         >
           ordered list
         </button>
         <button
           @click="editor.chain().focus().toggleCodeBlock().run()"
           :class="{ 'is-active': editor.isActive('codeBlock') }"
         >
           code block
         </button>
         <button
           @click="editor.chain().focus().toggleBlockquote().run()"
           :class="{ 'is-active': editor.isActive('blockquote') }"
         >
           blockquote
         </button>
         <button @click="editor.chain().focus().setHorizontalRule().run()">
           horizontal rule
         </button>
         <button @click="editor.chain().focus().setHardBreak().run()">
           hard break
         </button>
         <button
           @click="editor.chain().focus().undo().run()"
           :disabled="!editor.can().chain().focus().undo().run()"
         >
           undo
         </button>
         <button
           @click="editor.chain().focus().redo().run()"
           :disabled="!editor.can().chain().focus().redo().run()"
         >
           redo
         </button>
       </div>
       <EditorContent :editor="editor" />
     </div>
   </template>

   <script setup>
     const editor = useEditor({
       content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
       extensions: [TiptapStarterKit],
     });
   </script>
   ```

4. Now edit the HTML, replace `button` with your UI provided component, or style it using tailwind or whichever CSS you are using, add icons or text, modify active state class, verify dark mode, etc.

That's it! You can now use Nuxt TipTap Editor in your Nuxt app ✨

**P.S** Currently, this module only provides minimal and essential imports to quickly add TipTap Editor to your Nuxt 3 App. The only main reason this module came to exist is to provide auto import to your Nuxt 3 App. More features might be added later on.

## Development

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-tiptap-editor/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-tiptap-editor
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-tiptap-editor.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-tiptap-editor
[license-src]: https://img.shields.io/npm/l/nuxt-tiptap-editor.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-tiptap-editor
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
