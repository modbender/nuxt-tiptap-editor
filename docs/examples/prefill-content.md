---
title: Pre-fill Content Example
---

# Pre-fill Content

Pre-filling the content of editor is required in several cases.

There are 2 main ways of fill content

1.  During initialization:

    `content` field sets HTML into editor during initialization.

    ```js
    const editor = useEditor({
      content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
      extensions: [TiptapStarterKit],
    });

    onBeforeUnmount(() => {
      unref(editor).destroy();
    });
    ```

2.  During mount:

    Initialized `editor` various API among which `commands.setContent` function takes in a HTML string and sets the content into editor at any point of time.  
    During mount is just one example, the content can be set using the same function at any time after mount.

    ```js
    const editor = useEditor({
      extensions: [
        TiptapStarterKit
      ],
    });

    onMounted(() => {
      if (!!unref(editor)) {
        unref(editor).commands.setContent("<p>I'm running Tiptap with Vue.js. 🎉</p>");
      }
    });

    onBeforeUnmount(() => {
      unref(editor).destroy();
    });
    ```
