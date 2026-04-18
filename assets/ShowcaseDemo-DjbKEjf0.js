var e=`// ② 2026-03-24-ui-docs-ssot-prd.md
// src/pages/ShowcaseDemo.tsx
import { useCallback } from 'react'
import type { NormalizedData } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import { components } from './showcaseRegistry'
import { ax } from '@styles/ax'
import { TestRunnerPanel } from '../../devtools/testRunner/TestRunnerPanel'

export function ShowcaseDemo({ slug }: { slug?: string }) {
  const entry = components.find((c) => c.slug === slug)

  if (!entry) {
    return <div className={ax({ tone: 'danger', padding: 'sm' })}>Unknown component: {slug}</div>
  }

  return (
    <>
      <LiveDemo entry={entry} />
      {entry.testPath && (
        <TestRunnerPanel testPath={entry.testPath} autoRun={false} headless />
      )}
    </>
  )
}

function LiveDemo({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useStore(() => entry.makeData())
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  return <>{entry.render(data, onChange)}</>
}
`;export{e as default};