import { describe, it, expect } from 'vitest'

// Direct import tests - these will fail if exports change
describe('TipTap extension exports', () => {
  it('exports StarterKit from @tiptap/starter-kit', async () => {
    const module = await import('@tiptap/starter-kit')
    expect(module.StarterKit).toBeDefined()
    // Extension names are lowercase
    expect(module.StarterKit.name).toBe('starterKit')
  })

  it('exports useEditor from @tiptap/vue-3', async () => {
    const module = await import('@tiptap/vue-3')
    expect(module.useEditor).toBeDefined()
    expect(typeof module.useEditor).toBe('function')
  })

  it('exports Editor class from @tiptap/vue-3', async () => {
    const module = await import('@tiptap/vue-3')
    expect(module.Editor).toBeDefined()
  })

  it('exports EditorContent from @tiptap/vue-3', async () => {
    const module = await import('@tiptap/vue-3')
    expect(module.EditorContent).toBeDefined()
  })

  it('exports BubbleMenu from @tiptap/vue-3/menus', async () => {
    const module = await import('@tiptap/vue-3/menus')
    expect(module.BubbleMenu).toBeDefined()
  })

  it('exports FloatingMenu from @tiptap/vue-3/menus', async () => {
    const module = await import('@tiptap/vue-3/menus')
    expect(module.FloatingMenu).toBeDefined()
  })

  it('exports Link from @tiptap/extension-link', async () => {
    const module = await import('@tiptap/extension-link')
    expect(module.Link).toBeDefined()
  })

  it('exports Image from @tiptap/extension-image', async () => {
    const module = await import('@tiptap/extension-image')
    expect(module.Image).toBeDefined()
  })

  it('exports CodeBlockLowlight from @tiptap/extension-code-block-lowlight', async () => {
    const module = await import('@tiptap/extension-code-block-lowlight')
    expect(module.CodeBlockLowlight).toBeDefined()
  })
})

describe('Lowlight exports', () => {
  it('exports createLowlight', async () => {
    const module = await import('lowlight')
    expect(module.createLowlight).toBeDefined()
    expect(typeof module.createLowlight).toBe('function')
  })

  it('exports common languages', async () => {
    const module = await import('lowlight')
    expect(module.common).toBeDefined()
  })

  it('exports all languages', async () => {
    const module = await import('lowlight')
    expect(module.all).toBeDefined()
  })
})

// Note: @tiptap/pm cannot be imported directly - it requires subpath imports like @tiptap/pm/state
// The module is verified implicitly through StarterKit and other extensions that depend on it

describe('Core extension exports', () => {
  it('exports Node from @tiptap/core', async () => {
    const module = await import('@tiptap/core')
    expect(module.Node).toBeDefined()
  })

  it('exports Mark from @tiptap/core', async () => {
    const module = await import('@tiptap/core')
    expect(module.Mark).toBeDefined()
  })

  it('exports Extension from @tiptap/core', async () => {
    const module = await import('@tiptap/core')
    expect(module.Extension).toBeDefined()
  })
})
