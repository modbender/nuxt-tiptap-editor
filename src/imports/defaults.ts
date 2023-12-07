export const defaultNodes = [
  { name: "Blockquote", path: "@tiptap/extension-blockquote" },
  { name: "BulletList", path: "@tiptap/extension-bullet-list" },
  { name: "OrderedList", path: "@tiptap/extension-ordered-list" },
  { name: "ListItem", path: "@tiptap/extension-list-item" },
  { name: "CodeBlock", path: "@tiptap/extension-code-block" },
  { name: "Document", path: "@tiptap/extension-document" },
  { name: "HardBreak", path: "@tiptap/extension-hard-break" },
  { name: "Heading", path: "@tiptap/extension-heading" },
  { name: "HorizontalRule", path: "@tiptap/extension-horizontal-rule" },
  { name: "Paragraph", path: "@tiptap/extension-paragraph" },
  { name: "Text", path: "@tiptap/extension-text" },
];

export const defaultMarks = [
  { name: "Bold", path: "@tiptap/extension-bold" },
  { name: "Code", path: "@tiptap/extension-code" },
  { name: "Italic", path: "@tiptap/extension-italic" },
  { name: "Link", path: "@tiptap/extension-link" },
  { name: "Strike", path: "@tiptap/extension-strike" },
];

export const defaultExtensions = [
  { name: "StarterKit", path: "@tiptap/starter-kit" },
  { name: "BubbleMenu", path: "@tiptap/extension-bubble-menu" },
  { name: "Gapcursor", path: "@tiptap/extension-gapcursor" },
  { name: "FloatingMenu", path: "@tiptap/extension-floating-menu" },
  { name: "Dropcursor", path: "@tiptap/extension-dropcursor" },
  { name: "History", path: "@tiptap/extension-history" },
];

export const defaultImports = [
  { name: "Editor", path: "@tiptap/vue-3" },
  { name: "useEditor", path: "@tiptap/vue-3" },

  ...defaultNodes,
  ...defaultMarks,
  ...defaultExtensions,
];

export const defaultComponents = [
  { name: "EditorContent", path: "@tiptap/vue-3" },
  { name: "FloatingMenu", path: "@tiptap/vue-3" },
  { name: "BubbleMenu", path: "@tiptap/vue-3" },
];