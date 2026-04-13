import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

const HOOK = '/Users/user/Desktop/aria/.claude/hooks/guardOsPatterns.mjs'

function runHook(input) {
  try {
    const out = execSync(`node ${HOOK}`, { input: JSON.stringify(input), encoding: 'utf8' })
    return out ? JSON.parse(out) : null
  } catch (err) {
    return err.stdout ? JSON.parse(err.stdout) : null
  }
}

describe('guardOsPatterns: single-entry rule', () => {
  it('blocks when src/pages imports from @os/store', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/.worktrees/single-entry-refactor/src/pages/foo/Bar.tsx',
        content: `import { createStore } from '@os/store/createStore'\nexport const x = 1`,
      },
    })
    expect(result?.decision).toBe('block')
    expect(result.reason).toMatch(/single-entry/)
  })

  it('does NOT block when src/pages imports from @os/ui', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/.worktrees/single-entry-refactor/src/pages/foo/Bar.tsx',
        content: `import { TreeGrid } from '@os/ui'\nexport const x = 1`,
      },
    })
    if (result?.decision === 'block') {
      expect(result.reason).not.toMatch(/single-entry/)
    }
  })

  it('does NOT block when interactive-os internal cross-imports', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/.worktrees/single-entry-refactor/src/interactive-os/ui/TreeGrid.tsx',
        content: `import { useAria } from '../primitives/useAria'\nexport const x = 1`,
      },
    })
    if (result?.decision === 'block') {
      expect(result.reason).not.toMatch(/single-entry/)
    }
  })
})
