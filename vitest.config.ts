import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@os': path.resolve(__dirname, 'src/interactive-os'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@entities': path.resolve(__dirname, 'src/entities'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: ['node_modules/**', '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/interactive-os/axis/**',
        'src/interactive-os/plugins/**',
        'src/interactive-os/core/**',
        'src/interactive-os/ui/**',
      ],
      reporter: ['text', 'json'],
    },
  },
})
