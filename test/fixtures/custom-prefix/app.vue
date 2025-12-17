<template>
  <div>
    <div data-testid="editor-status">
      {{ editor ? 'ready' : 'loading' }}
    </div>
    <EditorEditorContent
      v-if="editor"
      :editor="editor"
      data-testid="editor-content"
    />
  </div>
</template>

<script setup>
const editor = useEditor({
  content: '<p>Custom prefix test</p>',
  extensions: [EditorStarterKit],
})
</script>
