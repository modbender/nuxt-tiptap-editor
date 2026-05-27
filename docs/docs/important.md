---
title: Important Points
---

# Important Points

There are some important points to remember when using Tiptap Editor.

## Correct Way

Any instance created when using `useEditor` will be available only on Client side.

FYI, the composable is provided by [@tiptap/vue-3](https://tiptap.dev/docs/editor/installation/vue3).

To test this, you can try the steps below:

1.  First declare editor instance

    ```js
    const editor = useEditor({
      extensions: [TiptapStarterKit],
    });
    ```

2.  Next let's try to access the value of variable, to do so we could log it into `console` like below:

    ```js
    console.log(unref(editor)); ❌
    // undefined
    ```

3.  The correct way to do step 2, is to access the variable on Client side
    ```js
    onMounted(() => {
      if (!!unref(editor)) { ✅
        // Will work fine because this is executed on Client side
        unref(editor).commands.setContent("<p>I'm running Tiptap with Vue.js. 🎉</p>");
      }
    });
    ```

## Destroy Editor

Function `destroy` stops the editor instance and unbinds all events.

Read [Official Documentation](https://tiptap.dev/docs/editor/api/editor#destroy) for more.

Why destroy editor:

- Stop editor instance.
- To release editor from memory.
- Unbind events like input, updates, toggles and more.
- To make next editor initialization smooth and error free.

When destroying editor, it's best done right before user is about to exit the page.

```js
onBeforeUnmount(() => {
  unref(editor).destroy();
});
```

## "Adding different instances of a keyed plugin" / `localsInner` errors

If you see `RangeError: Adding different instances of a keyed plugin (plugin$)` or `Cannot read properties of undefined (reading 'localsInner')`, your build has loaded **two copies of ProseMirror**. This happens when you install a TipTap extension directly (e.g. `@tiptap/extension-placeholder`) alongside the ones this module provides, and the bundler resolves a second `prosemirror-state`/`prosemirror-view`.

As of v3.4.0 the module deduplicates the ProseMirror packages automatically via `vite.resolve.dedupe`, so this should no longer occur. If you still hit it (e.g. with a non-default builder), add the same dedupe to your `nuxt.config`:

```ts
export default defineNuxtConfig({
  vite: {
    resolve: {
      dedupe: ['prosemirror-state', 'prosemirror-view', 'prosemirror-model'],
    },
  },
});
```
