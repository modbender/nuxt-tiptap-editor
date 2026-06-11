---
sidebar:
  order: 5
title: Image Upload Example
description: Use the built-in image-upload extension with paste, drag-and-drop, and a server upload route.
---

This example walks through the custom image-upload extension added **exclusively** to this Nuxt module.

:::tip[EXCLUSIVE TO PLUGIN]
This custom extension is built into Nuxt Tiptap Editor — it isn't a standard Tiptap package.
:::

## Overview

The module exposes two extensions, both auto-imported (with the default prefix):

- **`TiptapImageUpload`** — the upload extension. It inserts a placeholder, uploads the file through your handler, then swaps the placeholder for the final `image` node.
- **`TiptapImagePlaceholder`** — the placeholder node rendered while an upload is in flight.

Both depend on the `Image` extension (`TiptapImage`), which the module registers by default.

The extension handles three input paths automatically:

- **Paste** an image from the clipboard.
- **Drag and drop** image files into the editor.
- **Paste a remote image URL/HTML** — the image is fetched, converted to a file, and uploaded through your handler so you don't end up hot-linking third-party URLs. Use `ignoreDomains` to skip this for domains you trust (for example your own CDN).

## `TiptapImageUpload` options

Configure the extension with `.configure({ ... })`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `upload` | `(file: File \| string, id: string) => Promise<string>` | required | Your async upload handler. Receives the file (or a remote URL string) and a generated id, and must resolve to the final image URL. If omitted, uploads reject with an error. |
| `acceptMimes` | `string[]` | `['image/jpeg', 'image/gif', 'image/png', 'image/jpg']` | MIME types accepted on paste and drop. |
| `id` | `() => string` | random id generator | Function that produces the per-upload id passed to `upload`. |
| `ignoreDomains` | `string[]` | `[]` | Pasted image URLs whose `src` contains one of these substrings are left as-is instead of being re-uploaded. |

`TiptapImagePlaceholder` exposes an `inline` option (default `false`); set it to `true` to render the placeholder as `display: inline-block`.

### The `uploadImage` command

The extension also adds a chainable `uploadImage` command, so you can trigger an upload programmatically (for example from a file-input button):

```js
editor.commands.uploadImage({ file })
```

### Reading the in-flight file cache

While an upload is pending, the original file is cached by id. Read it from storage:

```js
const file = editor.storage.imageUploadExtension.getFileCache(id)
```

:::note
An older `editor.commands.getFileCache(id)` form still works but is **deprecated** and will be removed in the next major. Prefer the `editor.storage.imageUploadExtension.getFileCache(id)` form above.
:::

## Example component

The `uploadImage` handler below posts the file to a server route and returns the first URL it responds with — matching the playground.

```vue
<template>
  <div>
    <div v-if="editor">
      <button
        :disabled="!editor.can().chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >
        bold
      </button>
      <button
        :disabled="!editor.can().chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        italic
      </button>
      <button
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        code block
      </button>
      <button
        :disabled="!editor.can().chain().focus().undo().run()"
        @click="editor.chain().focus().undo().run()"
      >
        undo
      </button>
      <button
        :disabled="!editor.can().chain().focus().redo().run()"
        @click="editor.chain().focus().redo().run()"
      >
        redo
      </button>
    </div>
    <TiptapEditorContent :editor="editor" />
  </div>
</template>

<script setup>
async function uploadImage(file, id) {
  try {
    const formData = new FormData()
    formData.append(id, file)

    const urls = await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    return urls[0]
  }
  catch (e) {
    // Replace this with your own toast/notification system.
    console.error('Image upload failed:', e)
  }
}

const editor = useEditor({
  content: '<p>I\'m running Tiptap with Vue.js. 🎉</p>',
  extensions: [
    TiptapStarterKit,
    TiptapImage,
    TiptapImageUpload.configure({
      acceptMimes: ['image/jpeg', 'image/gif', 'image/png', 'image/jpg'],
      upload: uploadImage,
    }),
    TiptapImagePlaceholder.configure({
      inline: false,
    }),
  ],
})
</script>
```

## Server route

Your `upload` handler needs a server endpoint to accept the file and return its public URL. Below is a Nitro route adapted from the playground: it reads the multipart form, validates MIME type and size, sanitizes the filename, and writes the file to disk.

:::caution[Demo only]
This handler writes uploads to the local filesystem and performs no authentication. It exists to exercise the extension during development. A production handler must add **authentication/authorization**, stream to **object storage** (S3, GCS, R2, …), and consider audit logging and virus scanning. Do not ship this as-is.
:::

```ts
// server/api/upload.post.ts
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const UPLOAD_DIR = 'uploads'
const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

interface UploadFile {
  filename?: string
  type?: string
  data: Buffer
}

function sanitizeFilename(raw: string | undefined): string | null {
  if (!raw) return null
  // Strip any path components a malicious client tried to embed.
  const base = path.basename(raw)
  if (!base || base === '.' || base === '..') return null
  return base
}

export default defineEventHandler(async (event: H3Event) => {
  const fullUploadPath = path.join(process.cwd(), 'public', UPLOAD_DIR)

  if (!existsSync(fullUploadPath)) {
    await fs.mkdir(fullUploadPath, { recursive: true })
  }

  const files = (await readMultipartFormData(event)) as UploadFile[] | undefined
  if (!files?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })
  }

  const uploadedFilePaths: string[] = []

  for (const file of files) {
    if (!ALLOWED_MIMES.includes(file.type as typeof ALLOWED_MIMES[number])) {
      throw createError({
        statusCode: 415,
        statusMessage: `Unsupported media type: ${file.type ?? 'unknown'}`,
      })
    }

    if (file.data.byteLength > MAX_FILE_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: `File too large (max ${MAX_FILE_BYTES} bytes)`,
      })
    }

    const safeName = sanitizeFilename(file.filename)
    if (!safeName) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
    }

    // Prefix with a UUID so concurrent uploads can't collide and a crafted
    // name can't overwrite an existing file.
    const finalName = `${randomUUID()}-${safeName}`
    const filePath = path.join(fullUploadPath, finalName)
    await fs.writeFile(filePath, file.data)

    const urlPath = path.join(UPLOAD_DIR, finalName).replaceAll('\\', '/')
    uploadedFilePaths.push(`/${urlPath}`)
  }

  return uploadedFilePaths
})
```
