import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('SSR rendering', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('renders server-side without errors', async () => {
    const html = await $fetch('/')
    // The page should render without crashing
    expect(html).toBeDefined()
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('renders editor status element', async () => {
    const html = await $fetch('/')
    // The editor status element should be present
    expect(html).toContain('data-testid="editor-status"')
  })

  it('shows loading state on server (editor is client-only)', async () => {
    const html = await $fetch('/')
    // TipTap editor initializes on client, so SSR shows loading state
    expect(html).toContain('loading')
  })

  it('does not contain error messages', async () => {
    const html = await $fetch('/')
    expect(html).not.toContain('NuxtError')
    expect(html).not.toContain('500')
  })

  it('includes Nuxt app container', async () => {
    const html = await $fetch('/')
    expect(html).toContain('id="__nuxt"')
  })
})
