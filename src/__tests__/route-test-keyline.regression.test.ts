import { describe, it, expect } from 'vitest'

const demoModules = import.meta.glob<Record<string, unknown>>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: true },
)

describe('/test/keyline — demo modules convention', () => {
  for (const [path, mod] of Object.entries(demoModules)) {
    it(`${path} exports Demo`, () => {
      expect(typeof mod.Demo).toBe('function')
    })
  }
})
