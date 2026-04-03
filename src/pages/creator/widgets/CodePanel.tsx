// ② 2026-03-28-workspace-sync-prd.md

import { useState } from 'react'
import type { RegistryEntry } from '../componentRegistry'
import { SourceViewer } from './SourceViewer'
import { ax } from '@styles/ax'
import { PanelHeader } from '@os/ui/PanelHeader'
import styles from '../PageComponentCreator.module.css'

type SourceTab = 'tsx' | 'css'

export function CodePanel({ entry }: { entry: RegistryEntry | undefined }) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('tsx')
  return (
    <div className="flex-col overflow-hidden">
      <PanelHeader axes={{ textStyle: 'caption' }}>
        <button
          data-surface="action"
          className={`${ax({ text: 'muted' })} ${styles.sourceTab}${sourceTab === 'tsx' ? ` ${ax({ weight: 'medium' })} ${styles.sourceTabActive}` : ''}`}
          onClick={() => setSourceTab('tsx')}
        >
          TSX
        </button>
        <button
          data-surface="action"
          className={`${ax({ text: 'muted' })} ${styles.sourceTab}${sourceTab === 'css' ? ` ${ax({ weight: 'medium' })} ${styles.sourceTabActive}` : ''}`}
          onClick={() => setSourceTab('css')}
        >
          CSS
        </button>
      </PanelHeader>
      <div className="flex-1 overflow-auto min-h-0">
        {entry ? (
          <SourceViewer entry={entry} activeTab={sourceTab} />
        ) : (
          <div className={`flex-row items-center justify-center flex-1 ${ax({ textStyle: 'body' })} ${styles.emptyState}`}>
            컴포넌트를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
