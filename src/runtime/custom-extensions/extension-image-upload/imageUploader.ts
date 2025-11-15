import { Fragment, Slice } from 'prosemirror-model'
import type { Node } from 'prosemirror-model'
import 'prosemirror-replaceattrs' /// register it
import { Plugin } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import type { ImageUploaderPluginOptions } from './imageUpload'

let plugin: ImageUploaderPlugin | null = null
const fileCache: { [key: string]: File | string } = {}

export function imageUploader(options: ImageUploaderPluginOptions) {
  plugin = new ImageUploaderPlugin(options)
  const dummy = {}

  return new Plugin({
    props: {
      handleDOMEvents: {
        keydown(view: EditorView) {
          return !plugin?.setView(view)
        },

        drop(view: EditorView) {
          return !plugin?.setView(view)
        },

        focus(view: EditorView) {
          return !plugin?.setView(view)
        },
      },

      handlePaste(view: EditorView, event: ClipboardEvent) {
        return plugin?.setView(view).handlePaste(event) || false
      },

      transformPasted(slice: Slice) {
        // Workaround for missing view is provided above.
        return plugin?.transformPasted(slice) || slice
      },

      handleDrop(view: EditorView, event: DragEvent) {
        return plugin?.setView(view).handleDrop(event as DragEvent) || false
      },
    },

    state: {
      init() {
        return dummy
      },

      apply(tr, _value, _oldState, newState) {
        const filesOrUrls = tr.getMeta('uploadImages')

        if (filesOrUrls) {
          const arr: Array<File | string>
            = typeof filesOrUrls === 'string' || filesOrUrls instanceof File
              ? [filesOrUrls]
              : Array.from(filesOrUrls) // Probably a FileList or an array of files/urls

          // give some time for editor, otherwise history plugin forgets history
          setTimeout(() => {
            arr.forEach((item, i) =>
              plugin?.beforeUpload(item, newState.selection.from + i),
            )
            tr.setMeta('uploadImages', undefined)
          }, 10)
        }

        return dummy
      },
    },
  })
}

export class ImageUploaderPlugin {
  public view!: EditorView

  constructor(public config: ImageUploaderPluginOptions) {}

  public handleDrop(event: DragEvent) {
    if (!event.dataTransfer?.files.length) return

    const coordinates = this.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    })
    if (!coordinates) return

    const imageFiles = Array.from(event.dataTransfer.files).filter(file =>
      this.config.acceptMimes.includes(file.type),
    )
    if (!imageFiles.length) return

    imageFiles.forEach((file, i) => {
      this.beforeUpload(file, coordinates.pos + i)
    })

    return true
  }

  public transformPasted(slice: Slice) {
    const imageNodes: Array<{ url: string, id: string }> = []

    const children: Node[] = []
    slice.content.forEach((child) => {
      let newChild = child

      // if the node itself is image
      if (child.type.name === 'image' && !this.isOurOwnPic(child.attrs)) {
        newChild = this.newUploadingImageNode(child.attrs)
        imageNodes.push({
          id: newChild.attrs.uploadId,
          url: child.attrs.src || child.attrs['data-src'],
        })
      }
      else {
        child.descendants((node: Node, pos: number) => {
          if (node.type.name === 'image' && !this.isOurOwnPic(node.attrs)) {
            const imageNode = this.newUploadingImageNode(node.attrs)
            newChild = newChild.replace(
              pos,
              pos + 1,
              new Slice(Fragment.from(imageNode), 0, 0),
            )
            imageNodes.push({
              id: imageNode.attrs.uploadId,
              url: node.attrs.src || node.attrs['data-src'],
            })
          }
        })
      }

      children.push(newChild)
    })

    imageNodes.forEach(({ url, id }) => this.uploadImageForId(url, id))

    return new Slice(
      Fragment.fromArray(children),
      slice.openStart,
      slice.openEnd,
    )
  }

  public handlePaste(event: ClipboardEvent) {
    const items = Array.from(event.clipboardData?.items || [])

    // Clipboard may contain both html and image items (like when pasting from ms word, excel)
    // in that case (if there is any html), don't handle images.
    if (items.some(x => x.type === 'text/html')) {
      return false
    }

    const image = items.find(item =>
      this.config.acceptMimes.includes(item.type),
    )

    if (image) {
      this.beforeUpload(image.getAsFile()!, this.view.state.selection.from)
      return true
    }

    return false
  }

  public beforeUpload(fileOrUrl: File | string, at: number) {
    const tr = this.view.state.tr
    if (!tr.selection.empty) {
      tr.deleteSelection()
    }

    if (at < 0) {
      at = this.view.state.selection.from
    }

    // insert image node.
    const node = this.newUploadingImageNode({ src: fileOrUrl })
    tr.replaceWith(at, at, node)
    this.view.dispatch(tr)

    // upload image for above node
    this.uploadImageForId(fileOrUrl, node.attrs.uploadId)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public newUploadingImageNode(attrs: any): Node {
    // const empty_baseb4 = "data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'/%3E\n";
    const uploadId = this.config.id()
    fileCache[uploadId] = attrs.src || attrs['data-src']
    const imagePlaceholderNode = this.view.state.schema.nodes.imagePlaceholder
    if (!imagePlaceholderNode) {
      throw new Error('imagePlaceholder node type not found in schema')
    }
    // TypeScript doesn't narrow the type properly, so we use non-null assertion after the check
    return imagePlaceholderNode!.create({
      ...attrs,
      src: '', // attrs.src,
      uploadId,
    })
  }

  public async uploadImageForId(fileOrUrl: File | string, id: string) {
    const getImagePositions = () => {
      const positions: Array<{ node: Node, pos: number }> = []
      this.view.state.doc.descendants(
        (node: Node, pos: number) => {
          if (
            node.type.name === 'imagePlaceholder'
            && node.attrs.uploadId === id
          ) {
            positions.push({ node, pos })
          }
        },
      )

      return positions
    }

    let file: string | File | null = fileOrUrl
    if (typeof file === 'string') {
      file = await webImg2File(file)
    }

    const url
      = file
        && ((await this.config
          .upload(file, id)
        // tslint:disable-next-line:no-console
          .catch(console.warn)) as string | undefined)

    const imageNodes = getImagePositions()
    if (!imageNodes.length) {
      return
    }

    /// disallow user from undoing back to 'uploading' state.
    // let tr = this.view.state.tr.setMeta('addToHistory', false);
    const tr = this.view.state.tr

    imageNodes.forEach(({ node, pos }) => {
      if (url) {
        const imageNode = this.view.state.schema.nodes.image
        if (!imageNode) {
          throw new Error('image node type not found in schema')
        }
        // TypeScript doesn't narrow the type properly, so we use non-null assertion after the check
        const newNode = imageNode!.create({
          ...node.attrs,
          width: node.attrs.width,
          src: url,
        })
        tr.replaceWith(pos, pos + 1, newNode)
      }
      else {
        tr.delete(pos, pos + 1)
      }
    })

    this.view.dispatch(tr)
    fileCache[id] = ''
  }

  public setView(view: EditorView): this {
    this.view = view
    return this
  }

  private isOurOwnPic(attrs: { src?: string, ['data-src']?: string }): boolean {
    const src = attrs.src || attrs['data-src'] || ''
    return (this.config.ignoreDomains || []).some(domain =>
      src.includes(domain),
    )
  }
}

async function webImg2File(imgUrl: string): Promise<File | null> {
  function imgToBase64(url: string): Promise<string> {
    let canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d'),
      img = new Image()

    img.crossOrigin = 'Anonymous'
    img.setAttribute('referrerpolicy', 'no-referrer')
    img.src = url
    return new Promise((resolve, reject) => {
      img.onload = function () {
        canvas.height = img.height
        canvas.width = img.width
        ctx?.drawImage(img, 0, 0)
        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
        // @ts-expect-error canvas cleanup
        canvas = null
      }
      img.onerror = reject
    })
  }

  function base64toFile(base: string, filename: string): File {
    const arr = base.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch || !mimeMatch[1]) {
      throw new Error('Invalid base64 format: mime type not found')
    }
    // TypeScript doesn't narrow properly, so we use non-null assertion after the check
    const mime: string = mimeMatch[1]!
    const suffix = mime.split('/')[1]
    if (!arr[1]) {
      throw new Error('Invalid base64 format: data not found')
    }
    // TypeScript doesn't narrow properly, so we use non-null assertion after the check
    const bstr = atob(arr[1]!)
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    // Convert to file object
    return new File([u8arr], `${filename}.${suffix}`, { type: mime })
  }

  return imgToBase64(imgUrl)
    .then((base) => {
      return base64toFile(base, 'Web Image')
    })
    .catch(() => {
      return null
    })
}

// export function getPluginInstances() {
//   return plugin
// }
export function getFileCache(key: string) {
  return fileCache[key]
}
