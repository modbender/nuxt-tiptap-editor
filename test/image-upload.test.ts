/**
 * @vitest-environment happy-dom
 * @vitest-environment-options {"url": "https://app.example.com/editor"}
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Fragment, Slice } from '@tiptap/pm/model'
import type { Node as PMNode } from '@tiptap/pm/model'
import { closeHistory } from '@tiptap/pm/history'
import { TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

import { ImageUpload } from '../src/runtime/custom-extensions/extension-image-upload/imageUpload'
import { ImagePlaceholder } from '../src/runtime/custom-extensions/extension-image-upload/imagePlaceholder'
import {
  imageUploaderPluginKey,
  type ImageUploaderStorage,
} from '../src/runtime/custom-extensions/extension-image-upload/imageUploader'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeFile(name = 'test.png', type = 'image/png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type })
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

type UploadFn = (file: File | string, id: string, signal?: AbortSignal) => Promise<string>

function makeEditor(opts: {
  upload?: UploadFn
  ignoreDomains?: string[]
  id?: () => string
  content?: string
} = {}): Editor {
  const upload = opts.upload ?? (async () => 'https://cdn.example.com/uploaded.png')
  return new Editor({
    extensions: [
      StarterKit,
      Image,
      ImagePlaceholder,
      ImageUpload.configure({
        upload,
        ignoreDomains: opts.ignoreDomains ?? [],
        ...(opts.id ? { id: opts.id } : {}),
      }),
    ],
    content: opts.content ?? '<p>Hello World</p>',
  })
}

function pluginProps(editor: Editor) {
  const plugin = imageUploaderPluginKey.get(editor.state)
  if (!plugin) throw new Error('imageUploader plugin missing')
  const { transformPasted, handleDrop, handlePaste } = plugin.props
  return {
    transformPasted: (slice: Slice) =>
      transformPasted!.call(plugin, slice, editor.view, false),
    handleDrop: (event: unknown) =>
      handleDrop!.call(plugin, editor.view, event as DragEvent, Slice.empty, false),
    handlePaste: (event: unknown) =>
      handlePaste!.call(plugin, editor.view, event as ClipboardEvent, Slice.empty),
  }
}

function imageSlice(editor: Editor, attrsList: Array<Record<string, unknown>>): Slice {
  const imageType = editor.schema.nodes.image!
  return new Slice(
    Fragment.fromArray(attrsList.map(attrs => imageType.create(attrs))),
    0,
    0,
  )
}

/** Simulate a paste: run the slice through transformPasted, then insert it. */
function pasteImages(editor: Editor, attrsList: Array<Record<string, unknown>>): Slice {
  const original = imageSlice(editor, attrsList)
  const transformed = pluginProps(editor).transformPasted(original)
  editor.view.dispatch(editor.state.tr.replaceSelection(transformed))
  return transformed
}

function nodesOfType(editor: Editor, name: string): PMNode[] {
  const found: PMNode[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === name) found.push(node)
  })
  return found
}

function imageResponse(type = 'image/gif'): Response {
  return new Response(new Blob([new Uint8Array([0x47, 0x49, 0x46, 0x38])], { type }), {
    status: 200,
  })
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await flush()
}

describe('ImageUpload extension — command flow', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('uploadImage command inserts a placeholder node at the selection', async () => {
    editor = makeEditor()
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })

    expect(editor.getHTML()).toContain('<image-placeholder')
  })

  it('replaces placeholder with <img> when upload resolves', async () => {
    const d = deferred<string>()
    editor = makeEditor({ upload: () => d.promise })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })

    d.resolve('https://cdn.example.com/done.png')
    await flush()
    await flush()

    const html = editor.getHTML()
    expect(html).toContain('<img')
    expect(html).toContain('src="https://cdn.example.com/done.png"')
  })

  it('removes placeholder when upload rejects', async () => {
    const d = deferred<string>()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    editor = makeEditor({ upload: () => d.promise })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })

    d.reject(new Error('boom'))
    await flush()
    await flush()

    const html = editor.getHTML()
    expect(html).not.toContain('<img')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('image upload failed'),
      expect.any(Error),
    )
    warnSpy.mockRestore()
  })

  it('a failed upload removes only its own placeholder', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const failing = deferred<string>()
    const pending = deferred<string>()
    const queue = [failing, pending]
    editor = makeEditor({ upload: () => queue.shift()!.promise })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile('fails.png') })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile('survives.png') })
    await settle()
    const [, survivor] = nodesOfType(editor, 'imagePlaceholder')

    failing.reject(new Error('boom'))
    await settle()
    expect(nodesOfType(editor, 'imagePlaceholder').map(n => n.attrs.uploadId)).toEqual([
      survivor!.attrs.uploadId,
    ])

    pending.resolve('https://cdn.example.com/survives.png')
    await settle()
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([
      'https://cdn.example.com/survives.png',
    ])
    warnSpy.mockRestore()
  })

  it('caches the file under a unique upload id', async () => {
    const d = deferred<string>()
    let observedId: string | undefined
    editor = makeEditor({
      upload: async (_file, id) => {
        observedId = id
        return d.promise
      },
    })
    editor.commands.focus('end')
    const file = makeFile()
    editor.commands.uploadImage({ file })

    // The placeholder + cache write happen synchronously inside the command.
    const storage = editor.storage.imageUploadExtension as ImageUploaderStorage
    const cachedIds = Array.from(storage.cache.keys())
    expect(cachedIds).toHaveLength(1)
    expect(storage.cache.get(cachedIds[0]!)).toBe(file)

    // The upload itself is queued via microtask; flush so observedId resolves.
    await flush()
    expect(observedId).toBe(cachedIds[0])

    d.resolve('https://example.com/x.png')
    await flush()
    await flush()
    // After completion, cache is cleared
    expect(storage.getFileCache(observedId!)).toBeUndefined()
  })
})

describe('ImageUpload extension — storage API', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('exposes storage.cache and storage.getFileCache', () => {
    editor = makeEditor()
    const storage = editor.storage.imageUploadExtension as ImageUploaderStorage
    expect(storage.cache).toBeInstanceOf(Map)
    expect(typeof storage.getFileCache).toBe('function')
  })

  it('deprecated commands.getFileCache still returns the cached value', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    editor = makeEditor()
    const storage = editor.storage.imageUploadExtension as ImageUploaderStorage
    storage.cache.set('abc', makeFile('hi.png'))

    const result = (editor.commands as unknown as {
      getFileCache: (id: string) => File | string | undefined
    }).getFileCache('abc')

    expect(result).toBeInstanceOf(File)
    warnSpy.mockRestore()
  })
})

describe('ImageUpload extension — multi-editor isolation', () => {
  let editor1: Editor
  let editor2: Editor

  afterEach(() => {
    editor1?.destroy()
    editor2?.destroy()
  })

  it('each editor has its own storage map', () => {
    editor1 = makeEditor()
    editor2 = makeEditor()

    const s1 = editor1.storage.imageUploadExtension as ImageUploaderStorage
    const s2 = editor2.storage.imageUploadExtension as ImageUploaderStorage

    expect(s1).not.toBe(s2)
    expect(s1.cache).not.toBe(s2.cache)
  })

  it('an upload on one editor does not appear in the other editor', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()

    editor1 = makeEditor({ upload: () => d1.promise })
    editor2 = makeEditor({ upload: () => d2.promise })

    editor1.commands.focus('end')
    editor1.commands.uploadImage({ file: makeFile('one.png') })

    const s1 = editor1.storage.imageUploadExtension as ImageUploaderStorage
    const s2 = editor2.storage.imageUploadExtension as ImageUploaderStorage

    expect(s1.cache.size).toBe(1)
    expect(s2.cache.size).toBe(0)

    d1.resolve('https://example.com/one.png')
    await flush()
    await flush()
    expect(editor1.getHTML()).toContain('one.png')
    expect(editor2.getHTML()).not.toContain('one.png')
  })
})

describe('ImageUpload extension — defaults and validation', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('default upload handler rejects with an Error containing a clear message', async () => {
    editor = new Editor({
      extensions: [StarterKit, Image, ImagePlaceholder, ImageUpload],
    })
    const ext = editor.extensionManager.extensions.find(
      e => e.name === 'imageUploadExtension',
    )
    expect(ext).toBeDefined()
    await expect(ext!.options.upload(makeFile(), 'id')).rejects.toBeInstanceOf(
      Error,
    )
    await expect(ext!.options.upload(makeFile(), 'id')).rejects.toMatchObject({
      message: expect.stringContaining('missing an `upload` handler'),
    })
  })

  it('failing upload surfaces a useful console.warn when triggered from the command', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    editor = new Editor({
      extensions: [StarterKit, Image, ImagePlaceholder, ImageUpload],
    })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })
    await flush()
    await flush()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('image upload failed'),
      expect.any(Error),
    )
    warnSpy.mockRestore()
  })

  it('id() factory produces distinct ids across uploads', async () => {
    const d1 = deferred<string>()
    const d2 = deferred<string>()
    let i = 0
    const observed: string[] = []
    editor = makeEditor({
      upload: async (_f, id) => {
        observed.push(id)
        return i++ === 0 ? d1.promise : d2.promise
      },
    })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })

    await flush()
    expect(observed).toHaveLength(2)
    expect(observed[0]).not.toBe(observed[1])

    d1.resolve('https://example.com/a.png')
    d2.resolve('https://example.com/b.png')
    await flush()
    await flush()
  })
})

describe('ImageUpload extension — destroy clears cache', () => {
  it('clears storage.cache on editor destroy', () => {
    const editor = makeEditor()
    const storage = editor.storage.imageUploadExtension as ImageUploaderStorage
    storage.cache.set('a', makeFile())
    storage.cache.set('b', 'https://x/y')
    expect(storage.cache.size).toBe(2)
    editor.destroy()
    expect(storage.cache.size).toBe(0)
  })
})

describe('ImageUpload extension — pasted images (transformPasted)', () => {
  let editor: Editor
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async () => imageResponse())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    editor?.destroy()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('an internal drag-move does not re-upload the moved image', async () => {
    const upload = vi.fn<UploadFn>(async () => 'https://cdn.example.com/new.png')
    editor = makeEditor({ upload })
    const slice = imageSlice(editor, [{ src: 'https://elsewhere.example.org/a.png' }])
    ;(editor.view as EditorView & { dragging: unknown }).dragging = { slice, move: true }

    const result = pluginProps(editor).transformPasted(slice)
    await settle()

    expect(result).toBe(slice)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })

  it('restores the original image with its attrs when the re-upload fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    editor = makeEditor({
      upload: async () => {
        throw new Error('boom')
      },
    })
    editor.commands.focus('end')
    const original = {
      src: 'https://elsewhere.example.org/a.gif',
      alt: 'A cat',
      title: 'Cat',
      width: '120',
    }
    pasteImages(editor, [original])
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(1)

    await settle()

    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    const images = nodesOfType(editor, 'image')
    expect(images).toHaveLength(1)
    expect(images[0]!.attrs).toMatchObject(original)
  })

  it('restores the original image when upload() returns a non-image scheme', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    editor = makeEditor({ upload: async () => 'javascript:alert(1)' })
    editor.commands.focus('end')
    pasteImages(editor, [{ src: 'https://elsewhere.example.org/a.gif' }])
    await settle()

    const images = nodesOfType(editor, 'image')
    expect(images.map(n => n.attrs.src)).toEqual(['https://elsewhere.example.org/a.gif'])
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsupported image URL'),
      'javascript:alert(1)',
    )
  })

  it('carries alt/title to the uploaded image and keeps the original file type', async () => {
    const upload = vi.fn<UploadFn>(async () => 'https://cdn.example.com/up.gif')
    editor = makeEditor({ upload })
    editor.commands.focus('end')
    pasteImages(editor, [{ src: 'https://elsewhere.example.org/a.gif', alt: 'A cat', title: 'Cat' }])
    await settle()

    const images = nodesOfType(editor, 'image')
    expect(images).toHaveLength(1)
    expect(images[0]!.attrs).toMatchObject({
      src: 'https://cdn.example.com/up.gif',
      alt: 'A cat',
      title: 'Cat',
    })
    const uploaded = upload.mock.calls[0]![0] as File
    expect(uploaded.type).toBe('image/gif')
  })

  it('does not re-upload same-origin or relative srcs', async () => {
    const upload = vi.fn<UploadFn>(async () => 'https://cdn.example.com/x.png')
    editor = makeEditor({ upload })
    const slice = imageSlice(editor, [
      { src: '/uploads/a.png' },
      { src: 'https://app.example.com/uploads/b.png' },
    ])

    expect(pluginProps(editor).transformPasted(slice)).toBe(slice)
    await settle()
    expect(upload).not.toHaveBeenCalled()
  })

  it('matches ignoreDomains by hostname, not substring', async () => {
    const upload = vi.fn<UploadFn>(async (_file, id) => `https://cdn.example.com/${id}.gif`)
    editor = makeEditor({ upload, ignoreDomains: ['mycdn.com'] })
    editor.commands.focus('end')
    pasteImages(editor, [
      { src: 'https://mycdn.com/a.png' },
      { src: 'https://img.mycdn.com/b.png' },
      { src: 'https://evil.tld/?x=mycdn.com' },
      { src: 'https://notmycdn.com/c.png' },
    ])
    await settle()

    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      'https://evil.tld/?x=mycdn.com',
      'https://notmycdn.com/c.png',
    ])
    expect(upload).toHaveBeenCalledTimes(2)
  })

  it('skips the upload when the transformed slice is never inserted', async () => {
    const upload = vi.fn<UploadFn>(async () => 'https://cdn.example.com/x.png')
    editor = makeEditor({ upload })
    pluginProps(editor).transformPasted(
      imageSlice(editor, [{ src: 'https://elsewhere.example.org/a.png' }]),
    )
    await settle()

    expect(upload).not.toHaveBeenCalled()
    const storage = editor.storage.imageUploadExtension as ImageUploaderStorage
    expect(storage.cache.size).toBe(0)
  })

  it('does not warn when the editor is destroyed during the canvas fallback', async () => {
    fetchMock.mockRejectedValue(new TypeError('CORS'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    editor = makeEditor()
    editor.commands.focus('end')
    pasteImages(editor, [{ src: 'https://elsewhere.example.org/a.png' }])
    await settle()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    editor.destroy()
    await settle()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('keeps link marks on inline images through placeholder and upload', async () => {
    editor = new Editor({
      extensions: [
        StarterKit,
        Image.configure({ inline: true }),
        ImagePlaceholder.configure({ inline: true }),
        ImageUpload.configure({ upload: async () => 'https://cdn.example.com/up.gif' }),
      ],
      content: '<p>Hello</p>',
    })
    editor.commands.focus('end')
    const link = editor.schema.marks.link!.create({ href: 'https://example.com/' })
    const image = editor.schema.nodes.image!.create(
      { src: 'https://elsewhere.example.org/a.gif' },
      null,
      [link],
    )
    const transformed = pluginProps(editor).transformPasted(new Slice(Fragment.from(image), 0, 0))
    editor.view.dispatch(editor.state.tr.replaceSelection(transformed))

    const [placeholder] = nodesOfType(editor, 'imagePlaceholder')
    expect(placeholder!.marks.map(m => m.type.name)).toEqual(['link'])

    await settle()
    const [uploaded] = nodesOfType(editor, 'image')
    expect(uploaded!.attrs.src).toBe('https://cdn.example.com/up.gif')
    expect(uploaded!.marks.map(m => m.attrs.href)).toEqual(['https://example.com/'])
  })
})

describe('ImageUpload extension — drop and paste of files', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
    vi.restoreAllMocks()
  })

  function dropEvent(files: File[]) {
    return { dataTransfer: { files }, clientX: 0, clientY: 0 }
  }

  it('drop does not delete the selection and lands at the drop position', async () => {
    editor = makeEditor({ content: '<p>Hello World</p><p>Second</p>' })
    // Select "World".
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 7, 12)),
    )
    const secondParagraphStart = editor.state.doc.child(0).nodeSize
    vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({
      pos: secondParagraphStart,
      inside: -1,
    })

    expect(pluginProps(editor).handleDrop(dropEvent([makeFile()]))).toBe(true)

    const doc = editor.state.doc
    expect(doc.child(0).textContent).toBe('Hello World')
    expect(doc.child(1).type.name).toBe('imagePlaceholder')
    expect(doc.child(2).textContent).toBe('Second')
    await settle()
  })

  it('multiple dropped files all insert, in order, in one transaction', async () => {
    const upload = vi.fn<UploadFn>(async file => `https://cdn.example.com/${(file as File).name}`)
    editor = makeEditor({ upload, content: '<p>Hello World</p>' })
    vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({
      pos: editor.state.doc.content.size,
      inside: -1,
    })
    const dispatchSpy = vi.spyOn(editor.view, 'dispatch')

    pluginProps(editor).handleDrop(dropEvent([
      makeFile('a.png'),
      makeFile('b.png'),
      makeFile('c.png'),
    ]))
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(3)

    await settle()
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([
      'https://cdn.example.com/a.png',
      'https://cdn.example.com/b.png',
      'https://cdn.example.com/c.png',
    ])
  })

  it('paste uploads every image item on the clipboard', async () => {
    const upload = vi.fn<UploadFn>(async file => `https://cdn.example.com/${(file as File).name}`)
    editor = makeEditor({ upload })
    editor.commands.focus('end')
    const files = [makeFile('one.png'), makeFile('two.png')]
    const event = {
      clipboardData: {
        items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
      },
    }

    expect(pluginProps(editor).handlePaste(event)).toBe(true)
    await settle()
    expect(upload).toHaveBeenCalledTimes(2)
    expect(nodesOfType(editor, 'image')).toHaveLength(2)
  })
})

describe('ImageUpload extension — history', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('undo after a completed upload removes the image without resurrecting a placeholder; redo restores the image', async () => {
    editor = makeEditor({
      upload: async () => 'https://cdn.example.com/done.png',
      content: '<p>Hello</p><p>World</p>',
    })
    editor.commands.setTextSelection(6)
    editor.commands.uploadImage({ file: makeFile() })
    // Real uploads outlast the history grouping delay.
    editor.view.dispatch(closeHistory(editor.state.tr))
    await settle()
    expect(nodesOfType(editor, 'image')).toHaveLength(1)

    editor.commands.undo()
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    expect(nodesOfType(editor, 'image')).toHaveLength(0)
    expect(editor.state.doc.textContent).toBe('HelloWorld')

    editor.commands.redo()
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([
      'https://cdn.example.com/done.png',
    ])
  })

  it('redo after a data: paste failed mid-undo restores every original, oversized ones included', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => imageResponse()))
    const small = `data:image/gif;base64,${'A'.repeat(100)}`
    const large = `data:image/gif;base64,${'A'.repeat(70 * 1024)}`
    const uploads = [deferred<string>(), deferred<string>()]
    let call = 0
    editor = makeEditor({
      upload: () => uploads[call++]!.promise,
      content: '<p>Hello</p>',
    })
    editor.commands.focus('end')
    pasteImages(editor, [{ src: small }, { src: large }])
    await settle()

    editor.commands.undo()
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    uploads.forEach(d => d.reject(new Error('boom')))
    await settle()

    editor.commands.redo()

    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([small, large])
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('undo mid-upload removes the placeholder; redo after completion brings back the image', async () => {
    const d = deferred<string>()
    editor = makeEditor({ upload: () => d.promise })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })
    await settle()

    editor.commands.undo()
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)

    d.resolve('https://cdn.example.com/late.png')
    await settle()
    expect(nodesOfType(editor, 'image')).toHaveLength(0)

    editor.commands.redo()
    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([
      'https://cdn.example.com/late.png',
    ])
  })
})

describe('ImageUpload extension — lifetime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('editor destroyed mid-upload: aborts the signal, no throw, no dispatch', async () => {
    const d = deferred<string>()
    let receivedSignal: AbortSignal | undefined
    const editor = makeEditor({
      upload: (_file, _id, signal) => {
        receivedSignal = signal
        return d.promise
      },
    })
    editor.commands.focus('end')
    editor.commands.uploadImage({ file: makeFile() })
    await settle()
    expect(receivedSignal?.aborted).toBe(false)

    const view = editor.view
    const dispatchSpy = vi.spyOn(view, 'dispatch')
    editor.destroy()
    expect(receivedSignal?.aborted).toBe(true)

    d.resolve('https://cdn.example.com/late.png')
    await settle()
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('without the image node, uploadImage returns false instead of throwing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const editor = new Editor({
      extensions: [
        StarterKit,
        ImagePlaceholder,
        ImageUpload.configure({ upload: async () => 'https://x/y.png' }),
      ],
    })
    expect(editor.commands.uploadImage({ file: makeFile() })).toBe(false)
    editor.destroy()
  })
})

describe('ImagePlaceholder node', () => {
  let editor: Editor

  afterEach(() => {
    editor?.destroy()
  })

  it('getHTML round-trips through parseHTML', () => {
    editor = makeEditor({
      content: '<image-placeholder uploadid="abc" alt="A cat"></image-placeholder>',
    })
    const html = editor.getHTML()
    expect(html).toContain('<image-placeholder')
    const before = nodesOfType(editor, 'imagePlaceholder').map(n => n.toJSON())

    editor.commands.setContent(html)
    expect(nodesOfType(editor, 'imagePlaceholder').map(n => n.toJSON())).toEqual(before)
    expect(nodesOfType(editor, 'imagePlaceholder')[0]!.attrs).toMatchObject({
      uploadId: 'abc',
      alt: 'A cat',
    })
  })

  it('markdown image syntax creates an image, not an empty placeholder', () => {
    editor = makeEditor({ content: '<p></p>' })
    editor.commands.insertContent('![A cat](https://example.com/cat.png')
    const { from, to } = editor.state.selection
    editor.view.someProp('handleTextInput', f =>
      f(editor.view, from, to, ')', () => editor.state.tr),
    )

    expect(nodesOfType(editor, 'imagePlaceholder')).toHaveLength(0)
    expect(nodesOfType(editor, 'image').map(n => n.attrs.src)).toEqual([
      'https://example.com/cat.png',
    ])
  })

  it('default id() is non-empty and unique', () => {
    const id = ImageUpload.options.id
    const ids = new Set(Array.from({ length: 50 }, () => id()))
    expect(ids.size).toBe(50)
    expect([...ids].every(value => value.length > 0)).toBe(true)
  })
})
