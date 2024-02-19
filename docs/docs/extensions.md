---
title: Extensions
---

# Extensions

By default `@tiptap/extension-link` and `@tiptap/extension-code-block-lowlight` is installed.

::: details More Details
More about [Link Extension](https://tiptap.dev/docs/editor/api/marks/link)  
More about [Code Block Lowlight Extension](https://tiptap.dev/docs/editor/api/nodes/code-block-lowlight)
:::

Check out [Code Block Lowlight Example](/examples/lowlight)

By default all the Nodes, Marks and Extensions listed in [Tiptap Starter Kit](https://tiptap.dev/docs/editor/api/extensions/starter-kit) is available for use.

::: tip PREFIX
Remember that a default prefix `Tiptap` is applied to all imports except for composables.  

**Example:** `StarterKit` is available as `TiptapStarterKit`
:::

## Installing

It is always recommended to install extensions into `devDependencies`:

**Example:**
::: code-group

```sh [yarn]
yarn add -D @tiptap/extension-placeholder
```

```sh [npm]
npm install --save-dev @tiptap/extension-placeholder
```

```sh [pnpm]
pnpm add -D @tiptap/extension-placeholder
```
:::

## Importing

Whenever you install any **external** extension which is not included in this plugin by default, the best way to import it is to either create a `utils/` file or `/composable` file and put all the imports there.

An example would be; I created a file `/composables/tiptapExt.js` and the content of the file is as below:

```js
export { Image as TiptapImage } from "@tiptap/extension-image";
export { Youtube as TiptapYoutube } from "@tiptap/extension-youtube";
export { Underline as TiptapUnderline } from "@tiptap/extension-underline";
export { TextAlign as TiptapTextAlign } from "@tiptap/extension-text-align";
export { Placeholder as TiptapPlaceholder } from "@tiptap/extension-placeholder";
export { CharacterCount as TiptapCharacterCount } from "@tiptap/extension-character-count";
```

So by doing this, I have created a global import to all the extensions of Tiptap that I installed manually.