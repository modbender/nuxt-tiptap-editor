import { Fragment, Slice } from '@tiptap/pm/model'
import type { Node, Schema } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Transaction } from '@tiptap/pm/state'
import { Mapping, dropPoint } from '@tiptap/pm/transform'
import type { EditorView } from '@tiptap/pm/view'
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

export interface UploadJob {
  id: string
  source: File | string
  /** Attributes of a pasted image, restored if its re-upload fails. */
  restore?: Record<string, unknown>
}

interface UploadOutcome {
  src?: string
  restore?: Record<string, unknown>
}

interface UploadSession {
  controller: AbortController
  /**
   * Outcome per settled uploadId, applied to any placeholder that reappears
   * afterwards, e.g. through redo or paste.
   */
  settled: Map<string, UploadOutcome>
}

const IMAGE = 'image'
const PLACEHOLDER = 'imagePlaceholder'
const IMAGE_ATTRS_KEPT_ON_PLACEHOLDER = ['alt', 'title', 'width'] as const
const SAFE_SRC_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])
const REMOTE_PASTE_PROTOCOLS = new Set(['http:', 'https:'])
const EPHEMERAL_PASTE_PROTOCOLS = new Set(['blob:', 'data:'])
const MAX_SETTLED_OUTCOMES = 200
const LOG_PREFIX = '[nuxt-tiptap-editor]'

const sessions = new WeakMap<ImageUploaderStorage, UploadSession>()

function sessionOf(ctx: UploaderContext): UploadSession {
  let session = sessions.get(ctx.storage)
  if (!session) {
    session = { controller: new AbortController(), settled: new Map() }
    sessions.set(ctx.storage, session)
  }
  return session
}

/** Abort in-flight uploads and drop all per-editor upload state. */
export function disposeUploadSession(storage: ImageUploaderStorage): void {
  sessions.get(storage)?.controller.abort()
  sessions.delete(storage)
  storage.cache.clear()
}

export function missingNodeTypes(schema: Schema): string[] {
  return [IMAGE, PLACEHOLDER].filter(name => !schema.nodes[name])
}

export function canUpload(schema: Schema): boolean {
  return missingNodeTypes(schema).length === 0
}

function pickPlaceholderAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const name of IMAGE_ATTRS_KEPT_ON_PLACEHOLDER) {
    if (attrs[name] != null) picked[name] = attrs[name]
  }
  return picked
}

/**
 * Build a placeholder node for the given uploadId and cache its source so the
 * node view can render a preview.
 */
export function createPlaceholderNode(
  ctx: UploaderContext,
  schema: Schema,
  uploadId: string,
  source: File | string,
  imageAttrs: Record<string, unknown> = {},
): Node {
  const placeholderType = schema.nodes[PLACEHOLDER]
  if (!placeholderType) {
    throw new Error(
      `${LOG_PREFIX} imagePlaceholder node not found in schema. `
      + 'Add TiptapImagePlaceholder to the editor extensions.',
    )
  }
  ctx.storage.cache.set(uploadId, source)
  return placeholderType.create({ ...pickPlaceholderAttrs(imageAttrs), uploadId })
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
    appendTransaction(transactions, _oldState, newState) {
      const { settled } = sessionOf(ctx)
      if (!settled.size || !transactions.some(tr => tr.docChanged)) return null

      const tr = newState.tr
      const replaced = replacePlaceholders(
        tr,
        placeholder => outcomeNode(newState.schema, placeholder, settled.get(placeholder.attrs.uploadId)),
        changedRanges(transactions),
      )
      return replaced ? tr.setMeta('addToHistory', false) : null
    },
  })
}

function acceptedFiles(ctx: UploaderContext, files: Iterable<File | null>): File[] {
  return Array.from(files).filter(
    (file): file is File => !!file && ctx.options.acceptMimes.includes(file.type),
  )
}

function handleDrop(
  ctx: UploaderContext,
  view: EditorView,
  event: DragEvent,
): boolean {
  const files = acceptedFiles(ctx, event.dataTransfer?.files ?? [])
  if (!files.length || !canUpload(view.state.schema)) return false

  const coordinates = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  })
  if (!coordinates) return false

  insertPlaceholdersAndUpload(ctx, view, files, coordinates.pos)
  return true
}

function handlePaste(
  ctx: UploaderContext,
  view: EditorView,
  event: ClipboardEvent,
): boolean {
  const items = Array.from(event.clipboardData?.items ?? [])

  // Clipboard from Word/Excel/etc. contains both HTML and image items —
  // when HTML is present, defer to the standard paste handler.
  if (items.some(item => item.type === 'text/html')) return false

  const files = acceptedFiles(
    ctx,
    items.filter(item => item.kind === 'file').map(item => item.getAsFile()),
  )
  if (!files.length || !canUpload(view.state.schema)) return false

  insertPlaceholdersAndUpload(ctx, view, files)
  return true
}

function transformPasted(
  ctx: UploaderContext,
  view: EditorView,
  slice: Slice,
): Slice {
  // ProseMirror routes internal drag-moves through transformPasted too; the
  // moved images are already in place and must not be re-uploaded.
  if (view.dragging || !canUpload(view.state.schema)) return slice

  const jobs: UploadJob[] = []
  const content = mapNodes(slice.content, (node) => {
    if (node.type.name !== IMAGE || !shouldReupload(ctx, node.attrs.src)) {
      return null
    }
    const job: UploadJob = {
      id: ctx.options.id(),
      source: node.attrs.src,
      restore: { ...node.attrs },
    }
    jobs.push(job)
    return createPlaceholderNode(ctx, view.state.schema, job.id, job.source, node.attrs)
  })
  if (!jobs.length) return slice

  jobs.forEach(job => scheduleUpload(ctx, view, job))
  return new Slice(content, slice.openStart, slice.openEnd)
}

function mapNodes(
  fragment: Fragment,
  replace: (node: Node) => Node | null,
): Fragment {
  const children: Node[] = []
  fragment.forEach((child) => {
    const replacement = replace(child)
    if (replacement) children.push(replacement)
    else if (child.isLeaf) children.push(child)
    else children.push(child.copy(mapNodes(child.content, replace)))
  })
  return Fragment.fromArray(children)
}

/**
 * Insert one placeholder per source in a single transaction — at `at` (a drop
 * position) or over the current selection — then upload each.
 */
export function insertPlaceholdersAndUpload(
  ctx: UploaderContext,
  view: EditorView,
  sources: Array<File | string>,
  at?: number,
): void {
  const { schema } = view.state
  const jobs: UploadJob[] = sources.map(source => ({ id: ctx.options.id(), source }))
  const nodes = jobs.map(job => createPlaceholderNode(ctx, schema, job.id, job.source))
  const slice = new Slice(Fragment.fromArray(nodes), 0, 0)

  const tr = view.state.tr
  if (at === undefined) {
    tr.replaceSelection(slice)
  }
  else {
    const pos = dropPoint(tr.doc, at, slice) ?? at
    tr.replace(pos, pos, slice)
  }
  view.dispatch(tr)

  jobs.forEach(job => scheduleUpload(ctx, view, job))
}

/**
 * Upload the source of an inserted placeholder once the inserting transaction
 * has been dispatched, then swap the placeholder for the result.
 */
export function scheduleUpload(
  ctx: UploaderContext,
  view: EditorView,
  job: UploadJob,
): void {
  queueMicrotask(() => {
    void runUpload(ctx, view, job)
  })
}

async function runUpload(
  ctx: UploaderContext,
  view: EditorView,
  job: UploadJob,
): Promise<void> {
  const { signal } = sessionOf(ctx).controller
  // A slice from transformPasted may never be inserted (e.g. a drop or paste
  // handled elsewhere); skip uploads no placeholder is waiting for.
  if (signal.aborted || view.isDestroyed || !hasPlaceholder(view.state.doc, job.id)) {
    ctx.storage.cache.delete(job.id)
    return
  }

  let src: string | undefined
  try {
    const file = typeof job.source === 'string'
      ? await fetchAsFile(job.source, signal)
      : job.source
    if (file) {
      const url = await ctx.options.upload(file, job.id, signal)
      if (isSafeImageSrc(url)) src = url
      else console.warn(`${LOG_PREFIX} upload() returned an unsupported image URL:`, url)
    }
    else {
      console.warn(`${LOG_PREFIX} failed to fetch pasted image URL:`, job.source)
    }
  }
  catch (err) {
    if (!signal.aborted) console.warn(`${LOG_PREFIX} image upload failed:`, err)
  }
  finally {
    ctx.storage.cache.delete(job.id)
  }

  if (signal.aborted || view.isDestroyed) return
  settle(ctx, view, job, src)
}

function settle(
  ctx: UploaderContext,
  view: EditorView,
  job: UploadJob,
  src: string | undefined,
): void {
  const outcome: UploadOutcome = { src, restore: job.restore }
  const { settled } = sessionOf(ctx)
  settled.set(job.id, outcome)
  if (settled.size > MAX_SETTLED_OUTCOMES) {
    settled.delete(settled.keys().next().value as string)
  }

  const { schema } = view.state
  const tr = view.state.tr
  const replaced = replacePlaceholders(tr, placeholder =>
    placeholder.attrs.uploadId === job.id
      ? outcomeNode(schema, placeholder, outcome)
      : undefined,
  )
  if (replaced) view.dispatch(tr.setMeta('addToHistory', false))
}

/**
 * The node that replaces a settled placeholder: the uploaded image, the
 * original pasted image when its re-upload failed, or `null` to remove it.
 * `undefined` while the upload has not settled.
 */
function outcomeNode(
  schema: Schema,
  placeholder: Node,
  outcome: UploadOutcome | undefined,
): Node | null | undefined {
  if (!outcome) return undefined
  const imageType = schema.nodes[IMAGE]
  if (!imageType) return null
  if (outcome.src) {
    return imageType.create({ ...pickPlaceholderAttrs(placeholder.attrs), src: outcome.src })
  }
  return outcome.restore ? imageType.create(outcome.restore) : null
}

function hasPlaceholder(doc: Node, id: string): boolean {
  let found = false
  doc.descendants((node) => {
    if (found) return false
    if (node.type.name === PLACEHOLDER && node.attrs.uploadId === id) found = true
    return !found
  })
  return found
}

/**
 * Replace every placeholder in `ranges` that resolves to a node (or `null` for
 * removal); `undefined` leaves it alone. Works back-to-front so earlier
 * positions stay valid. Returns whether anything changed.
 */
function replacePlaceholders(
  tr: Transaction,
  resolve: (placeholder: Node) => Node | null | undefined,
  ranges: Array<[number, number]> = [[0, tr.doc.content.size]],
): boolean {
  const targets = new Map<number, { size: number, outcome: Node | null }>()
  for (const [from, to] of ranges) {
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name !== PLACEHOLDER) return true
      const outcome = resolve(node)
      if (outcome !== undefined) targets.set(pos, { size: node.nodeSize, outcome })
      return false
    })
  }

  const positions = [...targets.keys()].sort((a, b) => b - a)
  for (const pos of positions) {
    const { size, outcome } = targets.get(pos)!
    if (outcome) tr.replaceWith(pos, pos + size, outcome)
    else tr.delete(pos, pos + size)
  }
  return positions.length > 0
}

/** Ranges of the final document touched by the given transactions. */
function changedRanges(transactions: readonly Transaction[]): Array<[number, number]> {
  const maps = transactions.flatMap(tr => tr.mapping.maps)
  const ranges: Array<[number, number]> = []
  maps.forEach((map, i) => {
    const rest = new Mapping(maps.slice(i + 1))
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      ranges.push([rest.map(newStart, -1), rest.map(newEnd, 1)])
    })
  })
  return ranges
}

function currentLocation(): URL | undefined {
  try {
    return new URL(globalThis.location.href)
  }
  catch {
    return undefined
  }
}

/**
 * Whether a pasted image's src should be re-uploaded: ephemeral sources
 * (blob:, data:) always; http(s) only when cross-origin and not on an
 * ignored domain.
 */
function shouldReupload(ctx: UploaderContext, src: unknown): src is string {
  if (typeof src !== 'string' || !src) return false
  const here = currentLocation()
  let url: URL
  try {
    url = new URL(src, here)
  }
  catch {
    return false
  }
  if (EPHEMERAL_PASTE_PROTOCOLS.has(url.protocol)) return true
  if (!REMOTE_PASTE_PROTOCOLS.has(url.protocol)) return false
  if (url.origin === here?.origin) return false
  return !isIgnoredHost(url.hostname, ctx.options.ignoreDomains ?? [])
}

function hostnameOf(domain: string): string {
  const bare = domain.trim().replace(/^\.+/, '')
  try {
    return new URL(bare.includes('://') ? bare : `http://${bare}`).hostname
  }
  catch {
    return bare.toLowerCase()
  }
}

/** Exact hostname or subdomain match; never a substring match. */
function isIgnoredHost(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => {
    const host = hostnameOf(domain)
    return !!host && (hostname === host || hostname.endsWith(`.${host}`))
  })
}

/** Accept http(s), blob, data:image and relative URLs as an image src. */
function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== 'string' || !src.trim()) return false
  let url: URL
  try {
    url = new URL(src, 'http://relative.invalid/')
  }
  catch {
    return false
  }
  if (url.protocol === 'data:') return url.pathname.toLowerCase().startsWith('image/')
  return SAFE_SRC_PROTOCOLS.has(url.protocol)
}

function imageFile(blob: Blob): File {
  const subtype = blob.type.split('/')[1]?.split('+')[0] || 'bin'
  return new File([blob], `Web Image.${subtype}`, { type: blob.type })
}

/**
 * Fetch an image URL as a File, keeping its original bytes and type. Falls
 * back to re-encoding through a canvas (PNG) when fetch is blocked; resolves
 * `null` when neither works.
 */
async function fetchAsFile(url: string, signal: AbortSignal): Promise<File | null> {
  try {
    const response = await fetch(url, { signal, referrerPolicy: 'no-referrer' })
    if (response.ok) {
      const blob = await response.blob()
      if (blob.type.startsWith('image/')) return imageFile(blob)
    }
  }
  catch (err) {
    if (signal.aborted) throw err
  }
  return canvasFile(url, signal)
}

function canvasFile(url: string, signal: AbortSignal): Promise<File | null> {
  return new Promise((done) => {
    if (signal.aborted || typeof document === 'undefined') return done(null)
    const onAbort = () => resolve(null)
    const resolve = (file: File | null) => {
      signal.removeEventListener('abort', onAbort)
      done(file)
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')?.drawImage(img, 0, 0)
        // A CORS-tainted canvas throws a SecurityError here.
        canvas.toBlob(blob => resolve(blob ? imageFile(blob) : null), 'image/png')
      }
      catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    signal.addEventListener('abort', onAbort, { once: true })
    img.src = url
  })
}
