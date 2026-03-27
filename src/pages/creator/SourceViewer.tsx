// ② 2026-03-27-component-creator-prd.md

import { CodeBlock } from '../../interactive-os/ui/CodeBlock'
import type { RegistryEntry } from './componentRegistry'
import styles from './PageComponentCreator.module.css'

// Glob raw source for TSX and CSS
const tsxSources = import.meta.glob<string>(
  '../../interactive-os/ui/*.tsx',
  { query: '?raw', import: 'default', eager: true },
)
const cssSources = import.meta.glob<string>(
  '../../interactive-os/ui/*.module.css',
  { query: '?raw', import: 'default', eager: true },
)

interface SourceViewerProps {
  entry: RegistryEntry
  activeTab: 'tsx' | 'css'
}

export function SourceViewer({ entry, activeTab }: SourceViewerProps) {
  if (activeTab === 'tsx') {
    const source = tsxSources[entry.tsxPath] ?? ''
    return source
      ? <CodeBlock code={source} filename={`${entry.name}.tsx`} variant="flush" />
      : <div className={styles.canvasEmpty}>TSX source not found</div>
  }

  if (!entry.cssPath) {
    return <div className={`flex-row items-center justify-center ${styles.canvasEmpty}`}>No CSS module</div>
  }

  const source = cssSources[entry.cssPath] ?? ''
  return source
    ? <CodeBlock code={source} filename={`${entry.name}.module.css`} variant="flush" />
    : <div className={styles.canvasEmpty}>CSS source not found</div>
}
