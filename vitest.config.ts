import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    exclude: ['node_modules/**', '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/interactive-os/axes/**',
        'src/interactive-os/plugins/**',
        'src/interactive-os/core/**',
      ],
      reporter: ['text', 'json'],
    },
  },
})
