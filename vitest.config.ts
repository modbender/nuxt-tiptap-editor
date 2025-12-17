import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Longer timeout for Nuxt setup
    testTimeout: 60000,
    hookTimeout: 60000,
    // Default to node environment
    environment: 'node',
    // Run tests in parallel by default, but each test file runs its tests sequentially
    // This allows fast unit tests to run in parallel while E2E tests
    // with Nuxt fixtures can still work (each file gets its own process)
    fileParallelism: true,
    // Use threads for faster execution
    pool: 'threads',
  },
})
