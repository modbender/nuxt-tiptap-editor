import { Extension } from '@tiptap/core'
import {
  createPlaceholderNode,
  imageUploader,
  uploadAndReplaceById,
  type ImageUploaderStorage,
} from './imageUploader'

export interface ImageUploaderPluginOptions {
  acceptMimes: string[]
  upload: (file: File | string, id: string) => Promise<string>
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
      id: () => Math.random().toString(36).substring(7),
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

  onDestroy() {
    this.storage.cache.clear()
  },

  addCommands() {
    return {
      uploadImage:
        options =>
          ({ tr, state, dispatch }) => {
            const ctx = { options: this.options, storage: this.storage }
            const id = this.options.id()

            if (dispatch) {
              const node = createPlaceholderNode(ctx, state.schema, id, {
                src: options.file,
              })
              if (!tr.selection.empty) tr.deleteSelection()
              tr.replaceSelectionWith(node)

              // Defer the upload until after the placeholder transaction is
              // dispatched by TipTap, then replace by id.
              const editor = this.editor
              queueMicrotask(() => {
                if (!editor.view || editor.isDestroyed) return
                void uploadAndReplaceById(ctx, editor.view, id, options.file)
              })
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
