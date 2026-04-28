<template>
  <div>
    <div data-testid="editor-status">
      {{ editor ? 'ready' : 'loading' }}
    </div>
    <TiptapEditorContent
      v-if="editor"
      :editor="editor"
      data-testid="editor-content"
    />
  </div>
</template>

<script setup>
const lowlight = createLowlight(commonLanguages)

const editor = useEditor({
  content: '<pre><code class="language-javascript">const x = 1;</code></pre>',
  extensions: [
    TiptapStarterKit.configure({
      codeBlock: false,
    }),
    TiptapCodeBlockLowlight.configure({
      lowlight,
    }),
  ],
})
</script>
