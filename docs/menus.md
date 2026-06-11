---
title: Menus
description: Use the auto-registered bubble and floating menu components for contextual editor toolbars.
---

The module auto-registers two menu components from `@tiptap/vue-3/menus`:

- **`TiptapBubbleMenu`** — a toolbar that appears above the current text selection.
- **`TiptapFloatingMenu`** — a toolbar that appears on empty lines, for inserting block-level content.

Both take the editor instance as their `editor` prop and render whatever you put in their default slot. They only appear once the editor exists on the client, so render them inside a `v-if="editor"` guard like the rest of your toolbar.

## Bubble menu

A bubble menu is shown above a non-empty text selection — handy for inline formatting like bold, italic, and strike.

```vue
<template>
  <div>
    <TiptapBubbleMenu v-if="editor" :editor="editor">
      <div class="bubble-menu">
        <button
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        >
          bold
        </button>
        <button
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          italic
        </button>
        <button
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          strike
        </button>
      </div>
    </TiptapBubbleMenu>

    <TiptapEditorContent :editor="editor" />
  </div>
</template>

<script setup>
const editor = useEditor({
  content: '<p>Select some of this text to see the bubble menu. 🫧</p>',
  extensions: [TiptapStarterKit],
})
</script>
```

## Floating menu

A floating menu is shown on empty lines, so it's a good place for "insert" actions like headings and lists.

```vue
<template>
  <div>
    <TiptapFloatingMenu v-if="editor" :editor="editor">
      <div class="floating-menu">
        <button
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          h1
        </button>
        <button
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          bullet list
        </button>
        <button
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          @click="editor.chain().focus().toggleCodeBlock().run()"
        >
          code block
        </button>
      </div>
    </TiptapFloatingMenu>

    <TiptapEditorContent :editor="editor" />
  </div>
</template>

<script setup>
const editor = useEditor({
  content: '<p></p>',
  extensions: [TiptapStarterKit],
})
</script>
```

Both menus are unstyled by default — style the wrapping `div` (here `.bubble-menu` / `.floating-menu`) however you like.
