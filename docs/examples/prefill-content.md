---
title: Pre-fill Content Example
description: Set the editor's content during initialization or at any time with setContent.
---

Pre-filling the content of the editor is required in several cases.
**Example:** to update already existing data. In this case the existing data needs to be set first, so the user can modify it.

There are 2 main ways to fill content into the editor.

1.  During initialization:

    The `content` field sets HTML into the editor during initialization.

    ```js
    const editor = useEditor({
      content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
      extensions: [TiptapStarterKit],
    });
    ```

2.  Using `setContent`:

    An initialized `editor` provides various APIs, among them `commands.setContent`, which takes an HTML string and sets the content into the editor at any point in time.

    Doing this on mount is just one example — the same function can set content at any time after mount.

    ```js
    const editor = useEditor({
      extensions: [TiptapStarterKit],
    });

    onMounted(() => {
      if (unref(editor)) {
        unref(editor).commands.setContent(
          "<p>I'm running Tiptap with Vue.js. 🎉</p>",
        );
      }
    });
    ```
