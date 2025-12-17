import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('module configuration - custom prefix', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/custom-prefix', import.meta.url)),
  })

  it('renders page without errors', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('NuxtError')
    expect(html).not.toContain('500')
  })

  it('includes editor status element', async () => {
    const html = await $fetch('/')
    expect(html).toContain('data-testid="editor-status"')
  })

  it('custom prefix module initializes without breaking SSR', async () => {
    const html = await $fetch('/')
    // Editor shows loading on SSR (client-only)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('id="__nuxt"')
  })
})
