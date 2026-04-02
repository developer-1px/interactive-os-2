// ② 2026-03-28-workspace-sync-prd.md

import { useState } from 'react'
import type { RegistryEntry } from '../componentRegistry'
import { SourceViewer } from './SourceViewer'
import styles from '../PageComponentCreator.module.css'

type SourceTab = 'tsx' | 'css'

export function CodePanel({ entry }: { entry: RegistryEntry | undefined }) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('tsx')
  return (
    <div className="flex-col overflow-hidden">
      <div className={`flex-row items-center ${styles.paneHeader}`}>
        <button
          data-surface="action"
          className={`${styles.sourceTab}${sourceTab === 'tsx' ? ` ${styles.sourceTabActive}` : ''}`}
          onClick={() => setSourceTab('tsx')}
        >
          TSX
        </button>
        <button
          data-surface="action"
          className={`${styles.sourceTab}${sourceTab === 'css' ? ` ${styles.sourceTabActive}` : ''}`}
          onClick={() => setSourceTab('css')}
        >
          CSS
        </button>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {entry ? (
          <SourceViewer entry={entry} activeTab={sourceTab} />
        ) : (
          <div className={`flex-row items-center justify-center flex-1 ${styles.emptyState}`}>
            컴포넌트를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
