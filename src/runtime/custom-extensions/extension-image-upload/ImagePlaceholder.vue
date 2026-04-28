<template>
  <NodeViewWrapper
    class="image-placeholder"
    :class="{ inline: options.inline, uploading: !!base64 }"
  >
    <div
      v-if="isImgErr"
      class="iconfont icon-tupian"
    />
    <img
      v-else-if="base64"
      :src="base64"
      referrerpolicy="no-referrer"
      @error="isImgErr = true"
      @load="onLoad"
    >
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/vue-3'
import type { ImageUploaderStorage } from './imageUploader'

const props = defineProps<NodeViewProps>()

const attrs = computed(() => props.node.attrs)
const options = computed(() => props.extension.options)
const base64 = ref<string>('')
const isImgErr = ref(false)

onMounted(() => {
  const storage = props.editor.storage.imageUploadExtension as
    | ImageUploaderStorage
    | undefined
  const src = storage?.getFileCache(attrs.value.uploadId)

  if (src instanceof File) {
    const reader = new FileReader()
    reader.onload = () => {
      base64.value = typeof reader.result === 'string' ? reader.result : ''
    }
    reader.onerror = () => {
      isImgErr.value = true
    }
    reader.readAsDataURL(src)
  }
  else if (typeof src === 'string') {
    base64.value = src
  }
})

function onLoad(e: Event) {
  const target = e.target as HTMLImageElement | null
  const imgW = target?.naturalWidth || target?.clientWidth || 0
  const editorDom = props.editor.view.dom as HTMLElement
  const maxW = editorDom.clientWidth
  props.updateAttributes({
    width: imgW > maxW ? `${maxW}px` : undefined,
  })
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

  &.uploading::before {
    content: 'Uploading...';
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

  img {
    margin-top: -44px;
    max-width: 100%;
    opacity: 0.2;
  }
}
</style>
