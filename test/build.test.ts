import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('build verification', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    build: true,
  })

  it('builds successfully', async () => {
    // If we get here, setup with build: true succeeded
    expect(true).toBe(true)
  })

  it('built app serves without errors', async () => {
    const html = await $fetch('/')
    expect(html).toBeDefined()
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).not.toContain('NuxtError')
  })
})
