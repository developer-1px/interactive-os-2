// ② 2026-03-24-ui-docs-ssot-prd.md
// src/pages/ShowcaseDemo.tsx
import { useState, useCallback } from 'react'
import type { NormalizedData } from '../interactive-os/core/types'
import { components } from './showcaseRegistry'
import { TestRunnerPanel } from '../testRunner/TestRunnerPanel'

export function ShowcaseDemo({ slug }: { slug?: string }) {
  const entry = components.find((c) => c.slug === slug)

  if (!entry) {
    return <div style={{ color: 'var(--destructive)', padding: '8px' }}>Unknown component: {slug}</div>
  }

  if (entry.testPath) {
    return <TestRunnerPanel testPath={entry.testPath} autoRun />
  }

  return <LiveDemo entry={entry} />
}

function LiveDemo({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  return <>{entry.render(data, onChange)}</>
}
