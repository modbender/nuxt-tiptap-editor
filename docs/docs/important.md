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
