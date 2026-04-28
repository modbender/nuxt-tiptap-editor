# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Package manager is **pnpm** (see `packageManager` in `package.json`). Use pnpm, not npm/yarn.

- `pnpm dev:prepare` — **must be run once** after install (and after `src/` structural changes) to stub-build the module and prepare the playground. Without this, `pnpm dev` and tests can fail with type/import errors.
- `pnpm dev` — playground dev server (the playground is the manual test harness for the module)
- `pnpm prepack` — produce distribution build into `dist/` via `nuxt-module-build`
- `pnpm lint` / `pnpm lint:fix`
- `pnpm test` — runs `vitest run` **and** `vue-tsc --noEmit` (both must pass; type errors fail the suite)
- `pnpm test:watch` — vitest watch mode (no type-check)
- `pnpm test:types` — type-checks module and playground separately
- Run a single test file: `pnpm vitest run test/extensions.test.ts`
- Run a single test by name: `pnpm vitest run -t "test name pattern"`

## Architecture

This is a **Nuxt module** (Nuxt 3+/4-compatible) that registers TipTap as auto-imports and components. The module is *stateless config*: it reads `tiptap` options, then registers a curated list of TipTap exports through Nuxt Kit's `addImports` / `addComponent`.

### Import registration pipeline (`src/module.ts`)

Three categories of imports, all defined as `ImportObject[]` in `src/imports/`:

1. **defaults** (`src/imports/defaults.ts`) — always registered. Split into `defaultComposables`, `defaultNodes`, `defaultMarks`, `defaultExtensions`, `defaultComponents`.
2. **optional** (`src/imports/optional.ts`) — gated on module options. Currently only `lowlight` (enabled when `options.lowlight !== false`); enabling it also injects a highlight.js theme CSS link via CDN into `nuxt.options.app.head.link`.
3. **custom** (`src/imports/custom.ts`) — local extensions in `src/runtime/custom-extensions/`. Paths are resolved relative to the module via `createResolver(import.meta.url)`.

**Prefix rule** (important when adding new imports):
- Composables (`useEditor`, lowlight `createLowlight`, etc.) are registered **without** the prefix — they keep their original names.
- Everything else (extensions, nodes, marks, components) gets `options.prefix` prepended (default `Tiptap`), so `StarterKit` becomes `TiptapStarterKit`, `EditorContent` becomes `TiptapEditorContent`.

**Side effect of registration**: every `path` from a default/optional import is added to `nuxt.options.build.transpile`. This is why TipTap's ESM-only packages work in SSR. Custom imports use resolver paths and are *not* added to transpile (they're already inside the module).

The module also pushes `'@tiptap/vue-3'` into `nuxt.options.typescript.hoist` to fix type resolution in consumer projects.

### Adding a new TipTap extension or component

1. Add an `ImportObject` to the appropriate array in `src/imports/defaults.ts` (or `optional.ts` / `custom.ts`).
2. Components go through `addComponent` (registered as Vue components); everything else goes through `addImports` (auto-imported identifiers).
3. After editing imports, run `pnpm dev:prepare` to regenerate stubs before testing.

### Custom extensions

Located at `src/runtime/custom-extensions/<extension-name>/`, exposed via an `index.ts` barrel. The current example is `extension-image-upload/`, which exports `ImageUpload` and `ImagePlaceholder` (plus an `imageUploader.ts` runtime helper). Custom extensions are wired into the prefix pipeline like any other import — they get `Tiptap` prepended (e.g., `TiptapImageUpload`).

### Playground (`playground/`)

Standalone Nuxt app used as the dev harness. Demonstrates `TipTap.vue`, `TipTapImage.vue` (with the upload extension + `/api/upload` server route), and `TipTapLowlight.vue`. Tailwind + `@tailwindcss/typography` for styling. Not part of the published package.

## Testing

Tests are **E2E using `@nuxt/test-utils/e2e`**, not pure unit tests. Each test file calls `setup({ rootDir: ... })` pointing at a fixture in `test/fixtures/<name>/`, which boots a real Nuxt instance and lets the test `$fetch('/')` against it.

- Fixtures: `test/fixtures/basic`, `test/fixtures/custom-prefix`, `test/fixtures/lowlight` — each is a minimal Nuxt app exercising a different module configuration.
- `vitest.config.ts` sets `testTimeout: 60000` because Nuxt boot is slow; keep this in mind when adding tests.
- Tests run with `pool: 'threads'` and `fileParallelism: true` — each test file gets its own process so fixtures don't collide.
- When adding a new module option or option combination, **add a fixture** rather than trying to mock — the existing pattern is to spin up a real Nuxt app per scenario.

## Release flow

Releases publish via the `ltpr.yml` GitHub Actions workflow on tag push, **not** locally. Local commands only bump version + push tags:

- `pnpm release:patch` / `release:minor` / `release:major` — runs `pnpm version <bump>` (commits + tags), then `release:publish` (lint + test + prepack + `git push --follow-tags`).
- The legacy `pnpm release` script also publishes to npm directly; prefer the `release:patch/minor/major` flow because it lets the CI/OIDC publish path run.

See `RELEASE.md` for the full flow.

## Conventions

- ESLint config is `@nuxt/eslint-config/flat` with `tooling` + `stylistic` enabled. `@stylistic/operator-linebreak` is intentionally disabled (conflicts with `indent-binary-ops`).
- Husky + `lint-staged` run `eslint --fix` on staged JS/TS/Vue files pre-commit.
- TypeScript module options live in `src/types.d.ts`. The `HighlightTheme` union there is auto-derived from the highlight.js theme list — when bumping highlight.js, update it.
