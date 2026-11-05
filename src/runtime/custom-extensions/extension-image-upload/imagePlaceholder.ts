import type { Component } from 'vue'

import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import ImagePlaceholderComponent from './ImagePlaceholder.vue'

export interface ImagePlaceholderOptions {
  inline: boolean
  HTMLAttributes: Record<string, unknown>
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: 'imagePlaceholder',
  draggable: false,

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  addAttributes() {
    return {
      uploadId: {
        default: '',
      },
      width: {
        default: undefined,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'image-placeholder' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-placeholder', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(ImagePlaceholderComponent as Component)
  },
})
