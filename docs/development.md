---
sidebar:
  order: 7
title: Development
description: Run, test, and release Nuxt Tiptap Editor locally.
---

This project uses **pnpm** as its package manager.

```bash
# Install dependencies
pnpm install

# Generate type stubs (run once after install, and after src/ structural changes)
pnpm dev:prepare

# Develop with the playground (the manual test harness)
pnpm dev

# Run ESLint
pnpm lint
pnpm lint:fix

# Run the test suite (Vitest + vue-tsc type-check, both must pass)
pnpm test
pnpm test:watch

# Build the distribution bundle
pnpm prepack
```

:::note
`pnpm dev:prepare` must be run at least once before `pnpm dev` or `pnpm test`, otherwise they can fail with type or import errors.
:::

## Releasing

Releases publish from CI on a tag push, not from your machine. The local release scripts only bump the version and push the tag:

```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

Each runs `pnpm version <bump>` (which commits and tags), then lints, tests, builds, and pushes with `--follow-tags`. CI takes over from the tag to publish.
