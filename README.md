<h1 align="center">
   Nuxt TipTap Editor
</h1>

<p align="center">
  <a href="https://npmjs.com/package/nuxt-tiptap-editor" rel="nofollow">
    <img src="https://camo.githubusercontent.com/ae81dea5e450a972eb8017f2d165e5a708c2128f68e8c02b046d63ea85d0e186/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f762f6e7578742d7469707461702d656469746f722f6c61746573742e7376673f7374796c653d666c617426636f6c6f72413d31383138314226636f6c6f72423d323843463844" alt="npm version" data-canonical-src="https://img.shields.io/npm/v/nuxt-tiptap-editor/latest.svg?style=flat&amp;colorA=18181B&amp;colorB=28CF8D" style="max-width: 100%;"></a>
  <a href="https://npmjs.com/package/nuxt-tiptap-editor" rel="nofollow">
    <img src="https://camo.githubusercontent.com/a70996667de8939667a2064a939a4f44f42eb9a65228731c91e2b01301fe393c/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f646d2f6e7578742d7469707461702d656469746f722e7376673f7374796c653d666c617426636f6c6f72413d31383138314226636f6c6f72423d323843463844" alt="npm downloads" data-canonical-src="https://img.shields.io/npm/dm/nuxt-tiptap-editor.svg?style=flat&amp;colorA=18181B&amp;colorB=28CF8D" style="max-width: 100%;"></a>
  <a href="https://npmjs.com/package/nuxt-tiptap-editor" rel="nofollow">
    <img src="https://camo.githubusercontent.com/8ed006b5cde33cda61786bf5d50b53fd4557831141a6fa622361f1bdc98648eb/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f6e7578742d7469707461702d656469746f722e7376673f7374796c653d666c617426636f6c6f72413d31383138314226636f6c6f72423d323843463844" alt="License" data-canonical-src="https://img.shields.io/npm/l/nuxt-tiptap-editor.svg?style=flat&amp;colorA=18181B&amp;colorB=28CF8D" style="max-width: 100%;"></a>
  <a href="https://nuxt.com" rel="nofollow">
    <img src="https://camo.githubusercontent.com/4ba30edd28e1e16ce7322c5dfd4f878b3501d4cff8664612494d2237f1130d48/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e7578742d3138313831423f6c6f676f3d6e7578742e6a73" alt="Nuxt" data-canonical-src="https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js" style="max-width: 100%;">
  </a>
</p>

<p align="center">
  Instantly add <a href="https://tiptap.dev/editor" rel="nofollow">TipTap Editor</a> with basic functionality to your Nuxt 3 App.
</p>

<p align="center">
  <img src="https://assets-global.website-files.com/645a9acecda2e0594fac6126/65675de8c3c9cffc1a4a4d26_editor-eaxmple-placeholder-p-800.png" alt="Tiptap Editor Preview" />
</p>

---

- [📖 Full Documentation](https://nuxt-tiptap-editor.vercel.app)
- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🏀 Online playground](https://stackblitz.com/github/modbender/nuxt-tiptap-editor?file=playground%2Fapp.vue)
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Quick Setup

1. Add `nuxt-tiptap-editor` dependency to your project

   ```sh
   npx nuxi@latest module add tiptap
   ```

2. Add `nuxt-tiptap-editor` to the `modules` section of `nuxt.config.ts`

   ```js
   export default defineNuxtConfig({
     modules: ['nuxt-tiptap-editor'],
     tiptap: {
       prefix: 'Tiptap', //prefix for Tiptap imports, composables not included
     },
   });
   ```

3. You can use the contents of this file as reference.  
   Copy the code to your own `components/TiptapEditor.vue`.  
   Any path is fine as long as it's under `components` directory with `.vue` extension.

   ```vue
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
       <TiptapEditorContent :editor="editor" />
     </div>
   </template>

   <script setup>
   const editor = useEditor({
     content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
     extensions: [TiptapStarterKit],
   });

   onBeforeUnmount(() => {
     unref(editor).destroy();
   });
   </script>
   ```

4. Now edit the HTML, replace `button` with your UI provided component, or style it using tailwind or whichever CSS you are using, add icons or text, modify active state class, verify dark mode, etc.

That's it! You can now use Nuxt TipTap Editor in your Nuxt app ✨

## Development

```bash
# Install dependencies
yarn install

# Generate type stubs
yarn dev:prepare

# Develop with the playground
yarn dev

# Build the playground
yarn build

# Run ESLint
yarn lint

# Run Vitest
yarn test
yarn test:watch

# Release new version - needs to be with npm for login to work
npm run release
```

## Contribution

Feel free to send out any valid pull requests. Would love to get any help!

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-tiptap-editor/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-tiptap-editor
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-tiptap-editor.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-tiptap-editor
[license-src]: https://img.shields.io/npm/l/nuxt-tiptap-editor.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-tiptap-editor
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
