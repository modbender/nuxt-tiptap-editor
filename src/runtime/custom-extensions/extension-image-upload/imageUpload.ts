import { Extension } from '@tiptap/core'
import {
  canUpload,
  createPlaceholderNode,
  disposeUploadSession,
  imageUploader,
  missingNodeTypes,
  scheduleUpload,
  type ImageUploaderStorage,
} from './imageUploader'

export interface ImageUploaderPluginOptions {
  acceptMimes: string[]
  /**
   * Upload the file and resolve the URL to use as the image `src`. `signal`
   * is aborted when the editor is destroyed mid-upload.
   */
  upload: (file: File | string, id: string, signal?: AbortSignal) => Promise<string>
  id: () => string
  ignoreDomains: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUploadExtension: {
      /** Insert an image placeholder at the current selection and upload the file. */
      uploadImage: (options: { file: File | string }) => ReturnType
      /**
       * @deprecated Use `editor.storage.imageUploadExtension.getFileCache(id)` instead.
       * The command form will be removed in the next major.
       */
      getFileCache: (key: string) => ReturnType
    }
  }

  interface Storage {
    imageUploadExtension: ImageUploaderStorage
  }
}

const deprecationWarned = new WeakSet<object>()

function randomId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function uploadNotConfigured(): Promise<string> {
  return Promise.reject(
    new Error(
      '[nuxt-tiptap-editor] ImageUpload extension is missing an `upload` handler. '
      + 'Configure it via TiptapImageUpload.configure({ upload: async (file, id) => ... }).',
    ),
  )
}

export const ImageUpload = Extension.create<
  ImageUploaderPluginOptions,
  ImageUploaderStorage
>({
  name: 'imageUploadExtension',

  addOptions() {
    return {
      id: randomId,
      acceptMimes: ['image/jpeg', 'image/gif', 'image/png', 'image/jpg'],
      upload: uploadNotConfigured,
      ignoreDomains: [],
    }
  },

  addStorage() {
    const cache = new Map<string, File | string>()
    return {
      cache,
      getFileCache(id: string) {
        return cache.get(id)
      },
    }
  },

  onCreate() {
    const missing = missingNodeTypes(this.editor.schema)
    if (missing.length) {
      console.error(
        `[nuxt-tiptap-editor] ImageUpload is disabled: missing node type(s) ${missing.join(', ')}. `
        + 'Add TiptapImage and TiptapImagePlaceholder to the editor extensions.',
      )
    }
  },

  onDestroy() {
    disposeUploadSession(this.storage)
  },

  addCommands() {
    return {
      uploadImage:
        options =>
          ({ tr, state, dispatch, view }) => {
            if (!canUpload(state.schema)) return false

            if (dispatch) {
              const ctx = { options: this.options, storage: this.storage }
              const job = { id: this.options.id(), source: options.file }
              const node = createPlaceholderNode(ctx, state.schema, job.id, job.source)
              if (!tr.selection.empty) tr.deleteSelection()
              tr.replaceSelectionWith(node)
              scheduleUpload(ctx, view, job)
            }
            return true
          },

      // The original API returned the cached value from the command thunk
      // (non-standard — commands are supposed to return boolean). Preserved
      // here for one deprecation cycle so existing consumers keep working.
      getFileCache:
        (key: string) =>
          ({ editor }) => {
            if (
              import.meta.dev
                && editor
                && !deprecationWarned.has(editor)
            ) {
              deprecationWarned.add(editor)
              console.warn(
                '[nuxt-tiptap-editor] `editor.commands.getFileCache(id)` is '
                + 'deprecated and will be removed in the next major. Use '
                + '`editor.storage.imageUploadExtension.getFileCache(id)` instead.',
              )
            }
            return this.storage.cache.get(key) as unknown as boolean
          },
    }
  },

  addProseMirrorPlugins() {
    return [
      imageUploader({ options: this.options, storage: this.storage }),
    ]
  },
})
