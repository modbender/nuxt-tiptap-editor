import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('module configuration - default', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders page without errors', async () => {
    const html = await $fetch('/')
    expect(html).toBeDefined()
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('includes editor status element', async () => {
    const html = await $fetch('/')
    expect(html).toContain('data-testid="editor-status"')
  })

  it('module initializes without breaking SSR', async () => {
    const html = await $fetch('/')
    // No error pages
    expect(html).not.toContain('NuxtError')
    expect(html).not.toContain('500')
  })
})
