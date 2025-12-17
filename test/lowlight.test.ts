import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('module configuration - lowlight', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/lowlight', import.meta.url)),
  })

  it('injects highlight.js stylesheet', async () => {
    const html = await $fetch('/')
    expect(html).toContain('highlightjs/cdn-assets')
    expect(html).toContain('github-dark')
  })

  it('renders page without errors', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('NuxtError')
    expect(html).not.toContain('500')
  })

  it('lowlight module initializes without breaking SSR', async () => {
    const html = await $fetch('/')
    // Editor shows loading on SSR (client-only)
    expect(html).toContain('data-testid="editor-status"')
  })
})
