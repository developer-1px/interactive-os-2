// ② 2026-03-27-component-creator-prd.md

import { CodeBlock } from '@os/ui/CodeBlock'
import type { RegistryEntry } from '../componentRegistry'
import { ax } from '@styles/ax'
import '../PageComponentCreator.css'

// Glob raw source for TSX and CSS — keyed by filename for cross-directory matching
const tsxSources = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>(
      '../../../interactive-os/ui/*.tsx',
      { query: '?raw', import: 'default', eager: true },
    ),
  ).map(([path, src]) => [path.split('/').pop()!, src]),
)

const cssSources = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>(
      '../../../interactive-os/ui/*.css',
      { query: '?raw', import: 'default', eager: true },
    ),
  ).map(([path, src]) => [path.split('/').pop()!, src]),
)

interface SourceViewerProps {
  entry: RegistryEntry
  activeTab: 'tsx' | 'css'
}

export function SourceViewer({ entry, activeTab }: SourceViewerProps) {
  if (activeTab === 'tsx') {
    const source = tsxSources[`${entry.name}.tsx`] ?? ''
    return source
      ? <CodeBlock code={source} filename={`${entry.name}.tsx`} variant="flush" />
      : <div className={ax({ layout: 'center', padding: 'xl', text: 'muted' })}>TSX source not found</div>
  }

  if (!entry.cssPath) {
    return <div className={ax({ layout: 'center', padding: 'xl', text: 'muted' })}>No CSS module</div>
  }

  const source = cssSources[`${entry.name}.css`] ?? ''
  return source
    ? <CodeBlock code={source} filename={`${entry.name}.css`} variant="flush" />
    : <div className={ax({ layout: 'center', padding: 'xl', text: 'muted' })}>CSS source not found</div>
}
