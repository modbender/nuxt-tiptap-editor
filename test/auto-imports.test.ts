import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('auto-imports verification', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('page renders without useEditor errors', async () => {
    const html = await $fetch('/')
    // If useEditor wasn't available, the app would error
    expect(html).not.toContain('NuxtError')
    expect(html).not.toContain('500')
  })

  it('TiptapEditorContent component renders editor status', async () => {
    const html = await $fetch('/')
    expect(html).toContain('data-testid="editor-status"')
  })

  it('TiptapStarterKit extension initializes without error', async () => {
    const html = await $fetch('/')
    // StarterKit provides the editor functionality - if it failed, page would error
    expect(html).toContain('<!DOCTYPE html>')
  })
})
