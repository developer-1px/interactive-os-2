// ② 2026-03-28-workspace-sync-prd.md

import { useState } from 'react'
import type { RegistryEntry } from '../componentRegistry'
import { SourceViewer } from './SourceViewer'
import { ax } from '@styles/ax'
import { PanelHeader } from '@os/ui/PanelHeader'


type SourceTab = 'tsx' | 'css'

export function CodePanel({ entry }: { entry: RegistryEntry | undefined }) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('tsx')
  return (
    <div className="flex-col overflow-hidden">
      <PanelHeader axes={{ textStyle: 'caption' }}>
        <button
          className={ax({ surface: 'ghost', padding: 'xs', shape: 'sm', text: sourceTab === 'tsx' ? 'primary' : 'muted', weight: sourceTab === 'tsx' ? 'medium' : undefined })}
          onClick={() => setSourceTab('tsx')}
        >
          TSX
        </button>
        <button
          className={ax({ surface: 'ghost', padding: 'xs', shape: 'sm', text: sourceTab === 'css' ? 'primary' : 'muted', weight: sourceTab === 'css' ? 'medium' : undefined })}
          onClick={() => setSourceTab('css')}
        >
          CSS
        </button>
      </PanelHeader>
      <div className="flex-1 overflow-auto min-h-0">
        {entry ? (
          <SourceViewer entry={entry} activeTab={sourceTab} />
        ) : (
          <div className={ax({ layout: 'center', flex: '1', textStyle: 'body', text: 'muted' })}>
            컴포넌트를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
