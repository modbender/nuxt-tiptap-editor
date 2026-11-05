<template>
  <NodeViewWrapper
    class="image-placeholder"
    :class="{ inline: options.inline }"
  >
    <span
      class="image-placeholder__status"
      role="status"
      aria-live="polite"
    >Uploading...</span>
    <span
      v-if="isImgErr"
      class="image-placeholder__error"
    >Preview unavailable</span>
    <img
      v-else-if="previewSrc"
      :src="previewSrc"
      alt=""
      referrerpolicy="no-referrer"
      @error="isImgErr = true"
      @load="onLoad"
    >
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import type { ImageUploaderStorage } from './imageUploader'

const props = defineProps<NodeViewProps>()

const attrs = computed(() => props.node.attrs)
const options = computed(() => props.extension.options)
const previewSrc = ref<string>('')
const isImgErr = ref(false)
let objectUrl: string | undefined

onMounted(() => {
  const storage = props.editor.storage.imageUploadExtension as
    | ImageUploaderStorage
    | undefined
  const src = storage?.getFileCache(attrs.value.uploadId)

  if (src instanceof File) {
    objectUrl = URL.createObjectURL(src)
    previewSrc.value = objectUrl
  }
  else if (typeof src === 'string') {
    previewSrc.value = src
  }
})

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})

function onLoad(e: Event) {
  const target = e.target as HTMLImageElement | null
  const imgW = target?.naturalWidth || target?.clientWidth || 0
  const { view } = props.editor
  const maxW = (view.dom as HTMLElement).clientWidth
  const pos = props.getPos()
  if (view.isDestroyed || typeof pos !== 'number' || attrs.value.width || imgW <= maxW) {
    return
  }
  // Layout-only adjustment; keep it out of the undo history.
  view.dispatch(
    view.state.tr
      .setNodeMarkup(pos, undefined, { ...attrs.value, width: `${maxW}px` })
      .setMeta('addToHistory', false),
  )
}
</script>

<style lang="scss" scoped>
.image-placeholder {
  max-width: 100%;
  position: relative;
  width: fit-content;

  &.inline {
    display: inline-block;
  }

  &__status {
    position: sticky;
    width: 100%;
    top: 20%;
    left: 0;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    text-shadow: 2px 2px 14px #000;
    white-space: pre;
    display: block;
    line-height: 44px;
  }

  &__error {
    display: block;
    font-size: 14px;
    opacity: 0.7;
  }

  img {
    margin-top: -44px;
    max-width: 100%;
    opacity: 0.2;
  }
}
</style>
