# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This project uses **pnpm** as the package manager. Key commands:

- `pnpm dev` - Run development server for playground app
- `pnpm dev:prepare` - Build module in stub mode and prepare playground
- `pnpm build` - Build the playground application
- `pnpm prepack` - Build the module for distribution
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm test` - Run Vitest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:types` - Run Vue TypeScript checks for module and playground

## Architecture

This is a **Nuxt 3 module** that integrates TipTap editor functionality. Key architectural components:

### Module Structure
- `src/module.ts` - Main module definition using Nuxt Kit
- `src/imports/` - Auto-import definitions for TipTap components and composables
  - `defaults.ts` - Core TipTap imports (Editor, extensions, components)
  - `optional.ts` - Conditional imports (e.g., lowlight syntax highlighting)
  - `custom.ts` - Custom extensions and components specific to this module
- `src/runtime/` - Runtime components and extensions
- `src/types.d.ts` - TypeScript definitions and module options

### Import System
The module automatically imports TipTap functionality with configurable prefixes:
- **Composables**: `useEditor` (no prefix)
- **Components**: `TiptapEditorContent`, `TiptapFloatingMenu`, etc. (prefixed)
- **Extensions**: `TiptapStarterKit`, `TiptapImage`, etc. (prefixed)

### Configuration
Module options in `nuxt.config.ts`:
```typescript
tiptap: {
  prefix: 'Tiptap', // Prefix for imports (default)
  lowlight: {       // Optional syntax highlighting
    theme: 'github-dark',
    highlightJSVersion: '11.10.0'
  }
}
```

### Custom Extensions
- **Image Upload**: Custom image upload extension in `src/runtime/custom-extensions/extension-image-upload/`
- Auto-transpiles all TipTap packages and adds TypeScript hoisting for `@tiptap/vue-3`

### Playground
- Located in `playground/` directory
- Demonstrates module usage with various TipTap configurations
- Uses Tailwind CSS for styling
- Contains example components and upload API endpoint

## Testing

- Uses Vitest for unit testing
- Test fixtures in `test/fixtures/`
- Nuxt Test Utils for module testing
- TypeScript checks run separately for both module and playground