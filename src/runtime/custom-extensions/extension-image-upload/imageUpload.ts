import { Extension } from '@tiptap/core'
import { imageUploader, getFileCache } from './imageUploader'

export interface ImageUploaderPluginOptions {
  acceptMimes: string[]

  upload(file: File | string, id: string): Promise<string>

  id(): string

  ignoreDomains: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUploadExtension: {
      /** Add an image */
      uploadImage: (options: { file: File }) => ReturnType
    }
  }
}

export const ImageUpload = Extension.create<ImageUploaderPluginOptions>({
  name: 'imageUploadExtension',

  addOptions() {
    return {
      id: () => Math.random().toString(36).substring(7),
      acceptMimes: ['image/jpeg', 'image/gif', 'image/png', 'image/jpg'],
      upload: () => Promise.reject('Image Upload Extension Failed'),
      ignoreDomains: [],
    }
  },

  addCommands() {
    return {
      uploadImage:
                options =>
                  ({ tr }) => {
                    // const plugin = getPluginInstances()
                    // plugin?.beforeUpload(options.file, -1)
                    tr.setMeta('uploadImages', options.file)
                    return true
                  },
      getFileCache: (key: string) => () => {
        return getFileCache(key)
      },
    }
  },

  addProseMirrorPlugins() {
    const options = this.options
    return [imageUploader(options)]
  },
})
