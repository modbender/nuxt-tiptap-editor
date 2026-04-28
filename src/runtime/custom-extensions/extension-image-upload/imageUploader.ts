import { Fragment, Slice } from 'prosemirror-model'
import type { Node, Schema } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import type { ImageUploaderPluginOptions } from './imageUpload'

export interface ImageUploaderStorage {
  cache: Map<string, File | string>
  getFileCache: (id: string) => File | string | undefined
}

export const imageUploaderPluginKey = new PluginKey('imageUploader')

export interface UploaderContext {
  options: ImageUploaderPluginOptions
  storage: ImageUploaderStorage
}

/**
 * Build a placeholder node for the given uploadId. Used by the uploadImage
 * command, which mutates the provided transaction directly rather than
 * calling view.dispatch.
 */
export function createPlaceholderNode(
  ctx: UploaderContext,
  schema: Schema,
  uploadId: string,
  attrs: Record<string, unknown> = {},
): Node {
  const src
    = (attrs.src as File | string | undefined)
      ?? (attrs['data-src'] as File | string | undefined)
      ?? ''
  ctx.storage.cache.set(uploadId, src)

  const placeholderType = schema.nodes.imagePlaceholder
  if (!placeholderType) {
    throw new Error(
      '[nuxt-tiptap-editor] imagePlaceholder node not found in schema. '
      + 'Add TiptapImagePlaceholder to the editor extensions.',
    )
  }
  return placeholderType.create({ ...attrs, src: '', uploadId })
}

/**
 * Run the upload for an already-inserted placeholder identified by id.
 * Used by the uploadImage command's deferred follow-up.
 */
export async function uploadAndReplaceById(
  ctx: UploaderContext,
  view: EditorView,
  id: string,
  fileOrUrl: File | string,
): Promise<void> {
  await uploadAndReplace(ctx, view, fileOrUrl, id)
}

export function imageUploader(ctx: UploaderContext): Plugin {
  return new Plugin({
    key: imageUploaderPluginKey,
    props: {
      handlePaste(view, event) {
        return handlePaste(ctx, view, event)
      },
      transformPasted(slice, view) {
        return transformPasted(ctx, view, slice)
      },
      handleDrop(view, event) {
        return handleDrop(ctx, view, event as DragEvent)
      },
    },
  })
}

function handleDrop(
  ctx: UploaderContext,
  view: EditorView,
  event: DragEvent,
): boolean {
  if (!event.dataTransfer?.files.length) return false

  const coordinates = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  })
  if (!coordinates) return false

  const imageFiles = Array.from(event.dataTransfer.files).filter(file =>
    ctx.options.acceptMimes.includes(file.type),
  )
  if (!imageFiles.length) return false

  imageFiles.forEach((file, i) => {
    insertPlaceholderAndUpload(ctx, view, file, coordinates.pos + i)
  })

  return true
}

function handlePaste(
  ctx: UploaderContext,
  view: EditorView,
  event: ClipboardEvent,
): boolean {
  const items = Array.from(event.clipboardData?.items || [])

  // Clipboard from Word/Excel/etc. contains both HTML and image items —
  // when HTML is present, defer to the standard paste handler.
  if (items.some(x => x.type === 'text/html')) {
    return false
  }

  const image = items.find(item => ctx.options.acceptMimes.includes(item.type))
  if (!image) return false

  const file = image.getAsFile()
  if (!file) return false

  insertPlaceholderAndUpload(ctx, view, file, view.state.selection.from)
  return true
}

function transformPasted(
  ctx: UploaderContext,
  view: EditorView,
  slice: Slice,
): Slice {
  const queued: Array<{ url: string, id: string }> = []
  const children: Node[] = []

  slice.content.forEach((child) => {
    let newChild = child

    if (child.type.name === 'image' && !isOurOwnPic(ctx, child.attrs)) {
      newChild = newPlaceholderNode(ctx, view, child.attrs)
      queued.push({
        id: newChild.attrs.uploadId,
        url: child.attrs.src || child.attrs['data-src'],
      })
    }
    else {
      child.descendants((node, pos) => {
        if (node.type.name === 'image' && !isOurOwnPic(ctx, node.attrs)) {
          const placeholder = newPlaceholderNode(ctx, view, node.attrs)
          newChild = newChild.replace(
            pos,
            pos + 1,
            new Slice(Fragment.from(placeholder), 0, 0),
          )
          queued.push({
            id: placeholder.attrs.uploadId,
            url: node.attrs.src || node.attrs['data-src'],
          })
        }
      })
    }

    children.push(newChild)
  })

  queued.forEach(({ url, id }) => {
    void uploadAndReplace(ctx, view, url, id)
  })

  return new Slice(
    Fragment.fromArray(children),
    slice.openStart,
    slice.openEnd,
  )
}

export function insertPlaceholderAndUpload(
  ctx: UploaderContext,
  view: EditorView,
  fileOrUrl: File | string,
  at: number,
): void {
  let pos = at
  const tr = view.state.tr
  if (!tr.selection.empty) {
    tr.deleteSelection()
  }
  if (pos < 0) {
    pos = view.state.selection.from
  }

  const node = newPlaceholderNode(ctx, view, { src: fileOrUrl })
  tr.replaceWith(pos, pos, node)
  view.dispatch(tr)

  void uploadAndReplace(ctx, view, fileOrUrl, node.attrs.uploadId)
}

function newPlaceholderNode(
  ctx: UploaderContext,
  view: EditorView,
  attrs: Record<string, unknown>,
): Node {
  const uploadId = ctx.options.id()
  return createPlaceholderNode(ctx, view.state.schema, uploadId, attrs)
}

async function uploadAndReplace(
  ctx: UploaderContext,
  view: EditorView,
  fileOrUrl: File | string,
  id: string,
): Promise<void> {
  let file: File | string = fileOrUrl

  if (typeof file === 'string') {
    try {
      const fetched = await webImg2File(file)
      if (!fetched) {
        removePlaceholder(view, id)
        ctx.storage.cache.delete(id)
        return
      }
      file = fetched
    }
    catch (err) {
      console.warn(
        '[nuxt-tiptap-editor] failed to fetch pasted image URL:',
        err,
      )
      removePlaceholder(view, id)
      ctx.storage.cache.delete(id)
      return
    }
  }

  let url: string | undefined
  try {
    url = await ctx.options.upload(file, id)
  }
  catch (err) {
    console.warn('[nuxt-tiptap-editor] image upload failed:', err)
  }

  replaceOrRemovePlaceholder(view, id, url)
  ctx.storage.cache.delete(id)
}

function findPlaceholderPositions(
  view: EditorView,
  id: string,
): Array<{ node: Node, pos: number }> {
  const positions: Array<{ node: Node, pos: number }> = []
  view.state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'imagePlaceholder'
      && node.attrs.uploadId === id
    ) {
      positions.push({ node, pos })
    }
  })
  return positions
}

function replaceOrRemovePlaceholder(
  view: EditorView,
  id: string,
  url: string | undefined,
): void {
  const positions = findPlaceholderPositions(view, id)
  if (!positions.length) return

  const tr = view.state.tr
  positions.forEach(({ node, pos }) => {
    if (url) {
      const imageType = view.state.schema.nodes.image
      if (!imageType) {
        throw new Error(
          '[nuxt-tiptap-editor] image node not found in schema. '
          + 'Add TiptapImage to the editor extensions.',
        )
      }
      const imageNode = imageType.create({ ...node.attrs, src: url })
      tr.replaceWith(pos, pos + 1, imageNode)
    }
    else {
      tr.delete(pos, pos + 1)
    }
  })
  view.dispatch(tr)
}

function removePlaceholder(view: EditorView, id: string): void {
  replaceOrRemovePlaceholder(view, id, undefined)
}

function isOurOwnPic(
  ctx: UploaderContext,
  attrs: { src?: string, ['data-src']?: string },
): boolean {
  const src = attrs.src || attrs['data-src'] || ''
  return (ctx.options.ignoreDomains || []).some(domain => src.includes(domain))
}

async function webImg2File(imgUrl: string): Promise<File | null> {
  const base = await imgToBase64(imgUrl)
  return base64ToFile(base, 'Web Image')
}

function imgToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.crossOrigin = 'Anonymous'
    img.setAttribute('referrerpolicy', 'no-referrer')

    img.onload = () => {
      try {
        canvas.height = img.height
        canvas.width = img.width
        ctx?.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      catch (err) {
        // CORS-tainted canvas throws synchronously here in browsers.
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

function base64ToFile(base: string, filename: string): File {
  const arr = base.split(',')
  const prefix = arr[0]
  if (!prefix) {
    throw new Error('Invalid base64 format: data prefix not found')
  }
  const mimeMatch = prefix.match(/:(.*?);/)
  if (!mimeMatch?.[1]) {
    throw new Error('Invalid base64 format: mime type not found')
  }
  const mime = mimeMatch[1]
  const suffix = mime.split('/')[1] ?? 'bin'
  const data = arr[1]
  if (!data) {
    throw new Error('Invalid base64 format: data not found')
  }

  const bstr = atob(data)
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], `${filename}.${suffix}`, { type: mime })
}
