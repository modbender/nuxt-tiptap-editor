---
sidebar:
  order: 5
title: Auto-imports Reference
description: Every composable, component, node, mark, and extension the module registers, and the name it's available under.
---

The module registers its exports as Nuxt auto-imports, so you can use them in any component without importing them manually.

## The prefix rule

- **Composables keep their original names** — `useEditor`, and the lowlight helpers, are *not* prefixed.
- **Everything else** (the `Editor` class, nodes, marks, extensions, and components) gets the configured `prefix` prepended. The default prefix is `Tiptap`, so `StarterKit` becomes `TiptapStarterKit` and `EditorContent` becomes `TiptapEditorContent`.

Change the prefix in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-tiptap-editor'],
  tiptap: {
    prefix: 'Tiptap',
  },
})
```

The tables below assume the default `Tiptap` prefix.

## Composables (no prefix)

| Auto-import | Source | Notes |
| --- | --- | --- |
| `useEditor` | `@tiptap/vue-3` | Always registered. |
| `createLowlight` | `lowlight` | Only when `tiptap.lowlight !== false`. |
| `commonLanguages` | `lowlight` (`common`) | Only when lowlight is enabled. The `common` export, aliased. |
| `allLanguages` | `lowlight` (`all`) | Only when lowlight is enabled. The `all` export, aliased. |

:::caution
The lowlight language presets are exposed as `commonLanguages` and `allLanguages` — **not** `Tiptapcommon` or `Tiptapall`. They are composables, so they keep these names and are not prefixed.
:::

## Components (prefixed)

| Auto-import | Source |
| --- | --- |
| `TiptapEditorContent` | `@tiptap/vue-3` |
| `TiptapBubbleMenu` | `@tiptap/vue-3/menus` |
| `TiptapFloatingMenu` | `@tiptap/vue-3/menus` |

See [Menus](./menus) for usage of the bubble and floating menus.

## Core classes (prefixed)

| Auto-import | Source |
| --- | --- |
| `TiptapEditor` | `@tiptap/vue-3` |
| `TiptapNode` | `@tiptap/core` |
| `TiptapMark` | `@tiptap/core` |
| `TiptapExtension` | `@tiptap/core` |

## Nodes (prefixed)

| Auto-import | Source |
| --- | --- |
| `TiptapBlockquote` | `@tiptap/extension-blockquote` |
| `TiptapBulletList` | `@tiptap/extension-bullet-list` |
| `TiptapOrderedList` | `@tiptap/extension-ordered-list` |
| `TiptapListItem` | `@tiptap/extension-list-item` |
| `TiptapCodeBlock` | `@tiptap/extension-code-block` |
| `TiptapDocument` | `@tiptap/extension-document` |
| `TiptapHardBreak` | `@tiptap/extension-hard-break` |
| `TiptapHeading` | `@tiptap/extension-heading` |
| `TiptapHorizontalRule` | `@tiptap/extension-horizontal-rule` |
| `TiptapParagraph` | `@tiptap/extension-paragraph` |
| `TiptapText` | `@tiptap/extension-text` |

## Marks (prefixed)

| Auto-import | Source |
| --- | --- |
| `TiptapBold` | `@tiptap/extension-bold` |
| `TiptapCode` | `@tiptap/extension-code` |
| `TiptapItalic` | `@tiptap/extension-italic` |
| `TiptapLink` | `@tiptap/extension-link` |
| `TiptapStrike` | `@tiptap/extension-strike` |

## Extensions (prefixed)

| Auto-import | Source | Notes |
| --- | --- | --- |
| `TiptapStarterKit` | `@tiptap/starter-kit` | |
| `TiptapGapcursor` | `@tiptap/extension-gapcursor` | |
| `TiptapDropcursor` | `@tiptap/extension-dropcursor` | |
| `TiptapHistory` | `@tiptap/extension-history` | |
| `TiptapImage` | `@tiptap/extension-image` | |
| `TiptapCodeBlockLowlight` | `@tiptap/extension-code-block-lowlight` | Only when `tiptap.lowlight !== false`. |

## Custom extensions (prefixed)

| Auto-import | Notes |
| --- | --- |
| `TiptapImageUpload` | Custom image-upload extension. See [Image Upload](./examples/image-upload). |
| `TiptapImagePlaceholder` | Companion placeholder node used by `TiptapImageUpload`. |
