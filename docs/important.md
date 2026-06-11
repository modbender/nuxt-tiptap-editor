---
title: Important Points
description: Client-only editor instances, automatic cleanup, SSR behaviour, and the ProseMirror dedupe fix.
---

There are some important points to remember when using Tiptap Editor.

## Editor instances are client-only

Any instance created with `useEditor` is available only on the client side. The composable is provided by [@tiptap/vue-3](https://tiptap.dev/docs/editor/installation/vue3).

To see this, try the steps below:

1.  First declare an editor instance.

    ```js
    const editor = useEditor({
      extensions: [TiptapStarterKit],
    })
    ```

2.  Try to access its value during setup by logging it.

    ```js
    console.log(unref(editor)) // ❌
    // undefined
    ```

3.  The correct way is to access it on the client side, inside `onMounted`.

    ```js
    onMounted(() => {
      if (unref(editor)) {
        // ✅ runs on the client, so the instance exists
        unref(editor).commands.setContent("<p>I'm running Tiptap with Vue.js. 🎉</p>")
      }
    })
    ```

## Destroying the editor

In Tiptap v3, `useEditor` **automatically destroys the editor when the component unmounts** — it tears down the instance, releases it from memory, and unbinds all events for you. You do not need to call `onBeforeUnmount(() => editor.destroy())` for editors created with `useEditor`.

You only need `destroy()` manually if you create an editor instance yourself with `new Editor(...)` outside the composable, in which case you own its lifecycle:

```js
const editor = new TiptapEditor({
  extensions: [TiptapStarterKit],
})

onBeforeUnmount(() => {
  editor.destroy()
})
```

Read the [official documentation](https://tiptap.dev/docs/editor/api/editor#destroy) for more on `destroy`.

## How SSR works here

Tiptap's packages are ESM-only, which usually breaks during Nuxt's server-side rendering. This module handles that for you:

- Every Tiptap package it registers is added to `build.transpile`, so the ESM-only packages are transpiled and work under SSR.
- It hoists `@tiptap/vue-3` types via `typescript.hoist`, so type resolution works correctly in your project.

You get both of these automatically just by adding the module — no extra config required.

## "Adding different instances of a keyed plugin" / `localsInner` errors

If you see `RangeError: Adding different instances of a keyed plugin (plugin$)` or `Cannot read properties of undefined (reading 'localsInner')`, your build has loaded **two copies of ProseMirror**. This happens when you install a Tiptap extension directly (e.g. `@tiptap/extension-placeholder`) alongside the ones this module provides, and the bundler resolves a second `prosemirror-state`/`prosemirror-view`.

As of v3.4.0 the module deduplicates the ProseMirror packages automatically via `vite.resolve.dedupe`, so this should no longer occur. If you still hit it (e.g. with a non-default builder), add the same dedupe to your `nuxt.config`:

```ts
export default defineNuxtConfig({
  vite: {
    resolve: {
      dedupe: ['prosemirror-state', 'prosemirror-view', 'prosemirror-model'],
    },
  },
})
```
