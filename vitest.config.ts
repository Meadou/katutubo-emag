import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      // the page tests render the whole journey (nine peoples, every chapter); give a slow machine time
      testTimeout: 20000,
    },
  }),
)
