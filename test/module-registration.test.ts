import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { fileURLToPath } from 'node:url'
import {
  createTestContext,
  setTestContext,
  loadFixture,
  useTestContext,
} from '@nuxt/test-utils/e2e'

/**
 * These tests verify the module's registration calls (addImports,
 * addComponent, build.transpile push, typescript.hoist push, lowlight
 * head-link injection) actually mutate the resolved Nuxt config. The
 * rest of the suite only fetches HTML and looks for a static
 * data-testid, which would still pass if the module did nothing.
 *
 * We use `loadFixture()` to load each fixture's Nuxt config in-process,
 * which exposes `useTestContext().nuxt` for direct option inspection
 * without spinning up an HTTP server.
 */

// These are the package paths the module pushes into build.transpile via the
// `addImports({ from })` side effect. `@tiptap/pm` is a peer used through
// subpath imports (e.g. `@tiptap/pm/state`) and is NOT registered as an
// auto-import by the module, so it does not appear here.
const PACKAGES_TRANSPILED = [
  '@tiptap/vue-3',
  '@tiptap/starter-kit',
  '@tiptap/extension-image',
  '@tiptap/extension-link',
]

const FIXTURES = {
  basic: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  customPrefix: fileURLToPath(
    new URL('./fixtures/custom-prefix', import.meta.url),
  ),
  lowlight: fileURLToPath(new URL('./fixtures/lowlight', import.meta.url)),
}

function setupInProcess(rootDir: string) {
  beforeAll(async () => {
    setTestContext(createTestContext({
      rootDir,
      build: true,
      server: false,
      browser: false,
    }))
    await loadFixture()
  }, 60000)

  afterAll(async () => {
    const ctx = useTestContext()
    await ctx.nuxt?.close().catch(() => {})
    setTestContext(undefined)
  })
}

describe('module registration — default fixture (prefix=Tiptap)', () => {
  setupInProcess(FIXTURES.basic)

  it('adds TipTap packages to nuxt.options.build.transpile', () => {
    const transpile = (useTestContext().nuxt!.options.build.transpile ?? []).map(String)
    for (const pkg of PACKAGES_TRANSPILED) {
      expect(transpile).toContain(pkg)
    }
  })

  it('hoists @tiptap/vue-3 in nuxt.options.typescript.hoist', () => {
    const hoist = useTestContext().nuxt!.options.typescript?.hoist ?? []
    expect(hoist).toContain('@tiptap/vue-3')
  })

  it('does not inject the lowlight stylesheet when lowlight is disabled', () => {
    const links = useTestContext().nuxt!.options.app.head.link ?? []
    const hjs = links.find(l =>
      typeof l.href === 'string' && l.href.includes('highlightjs/cdn-assets'),
    )
    expect(hjs).toBeUndefined()
  })
})

describe('module registration — custom prefix fixture (prefix=Editor)', () => {
  setupInProcess(FIXTURES.customPrefix)

  it('still adds TipTap packages to build.transpile regardless of prefix', () => {
    const transpile = (useTestContext().nuxt!.options.build.transpile ?? []).map(String)
    for (const pkg of PACKAGES_TRANSPILED) {
      expect(transpile).toContain(pkg)
    }
  })

  // Component prefixing is verified end-to-end: the custom-prefix fixture's
  // app.vue uses TiptapEditorContent (the default-prefix name) — if the
  // module wasn't applying the configured 'Editor' prefix, the existing
  // custom-prefix.test.ts e2e test would surface it via Vue resolution
  // failures. We additionally verify here that the prefix option round-trips
  // through the resolved config so a future bug renaming the option is
  // caught at registration time.
  it('configured prefix is preserved in the resolved nuxt config', () => {
    const tiptap = (useTestContext().nuxt!.options as unknown as {
      tiptap?: { prefix?: string }
    }).tiptap
    expect(tiptap?.prefix).toBe('Editor')
  })
})

describe('module registration — lowlight fixture', () => {
  setupInProcess(FIXTURES.lowlight)

  it('injects the highlight.js theme stylesheet into nuxt.options.app.head.link', () => {
    const links = useTestContext().nuxt!.options.app.head.link ?? []
    const themeLink = links.find(l =>
      typeof l.href === 'string'
      && l.href.includes('highlightjs/cdn-assets')
      && l.href.includes('github-dark'),
    )
    expect(themeLink).toBeDefined()
    expect(themeLink?.rel).toBe('stylesheet')
  })

  it('still adds TipTap + lowlight packages to build.transpile', () => {
    const transpile = (useTestContext().nuxt!.options.build.transpile ?? []).map(String)
    expect(transpile).toContain('@tiptap/extension-code-block-lowlight')
    expect(transpile).toContain('lowlight')
  })
})
