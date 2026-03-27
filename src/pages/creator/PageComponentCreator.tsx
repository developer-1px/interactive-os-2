// ② 2026-03-28-workspace-sync-prd.md

import { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { componentRegistry, type RegistryEntry } from './componentRegistry'
import { ComponentCanvas } from './ComponentCanvas'
import { ComponentChat } from './ComponentChat'
import { SourceViewer } from './SourceViewer'
import { Workspace } from '../../interactive-os/ui/Workspace'
import { addEntity } from '../../interactive-os/store/createStore'
import { createStore } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import type { TabData } from '../../interactive-os/plugins/workspaceStore'
import { useLayoutKeys } from '../../hooks/useLayoutKeys'
import styles from './PageComponentCreator.module.css'

type SourceTab = 'tsx' | 'css'

// --- Code panel (owns sourceTab state internally) ---

function CodePanel({ entry }: { entry: RegistryEntry | undefined }) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('tsx')
  return (
    <div className={`flex-col ${styles.codePane}`}>
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
      <div className={`flex-1 overflow-auto ${styles.codeContent}`}>
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

// --- Fixed workspace layout ---

function createCreatorWorkspace(): NormalizedData {
  let s = createStore()

  // Root split: Canvas | Right
  const rootSplit: Entity = {
    id: 'split-main',
    data: { type: 'split', direction: 'horizontal', sizes: [0.5, 0.5] },
  }
  s = addEntity(s, rootSplit, ROOT_ID)

  // Left tabgroup: Canvas
  const canvasTg: Entity = { id: 'tg-canvas', data: { type: 'tabgroup', activeTabId: 'tab-canvas' } }
  s = addEntity(s, canvasTg, 'split-main')
  const canvasTab: Entity = { id: 'tab-canvas', data: { type: 'tab', label: 'Canvas', contentType: 'canvas', contentRef: 'canvas' } }
  s = addEntity(s, canvasTab, 'tg-canvas')

  // Right split: Code | Chat
  const rightSplit: Entity = {
    id: 'split-right',
    data: { type: 'split', direction: 'horizontal', sizes: [0.65, 0.35] },
  }
  s = addEntity(s, rightSplit, 'split-main')

  // Code tabgroup
  const codeTg: Entity = { id: 'tg-code', data: { type: 'tabgroup', activeTabId: 'tab-code' } }
  s = addEntity(s, codeTg, 'split-right')
  const codeTab: Entity = { id: 'tab-code', data: { type: 'tab', label: 'Code', contentType: 'code', contentRef: 'code' } }
  s = addEntity(s, codeTab, 'tg-code')

  // Chat tabgroup
  const chatTg: Entity = { id: 'tg-chat', data: { type: 'tabgroup', activeTabId: 'tab-chat' } }
  s = addEntity(s, chatTg, 'split-right')
  const chatTab: Entity = { id: 'tab-chat', data: { type: 'tab', label: 'Chat', contentType: 'chat', contentRef: 'chat' } }
  s = addEntity(s, chatTab, 'tg-chat')

  return s
}

// --- Component ---

export default function PageComponentCreator() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const selectedName = useMemo(() => {
    const segment = pathname.replace(/^\/creator\/?/, '').split('/')[0]
    return componentRegistry.find((e) => e.name === segment)?.name ?? componentRegistry[0]?.name ?? ''
  }, [pathname])

  const selectedEntry: RegistryEntry | undefined = useMemo(
    () => componentRegistry.find((e) => e.name === selectedName),
    [selectedName],
  )

  const handleSelectComponent = useCallback(
    (name: string) => navigate(`/creator/${name}`),
    [navigate],
  )

  const [wsData, setWsData] = useState(() => createCreatorWorkspace())

  const { onKeyDown: handleLayoutKeyDown } = useLayoutKeys({})

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentType) return null

    if (tabData.contentType === 'canvas') {
      return (
        <div className={`flex-col ${styles.canvasPane}`}>
          <div className={`flex-row items-center ${styles.paneHeader}`}>
            <span className={styles.paneTitle}>{selectedName || 'Select'}</span>
          </div>
          {selectedEntry ? (
            <ComponentCanvas entry={selectedEntry} />
          ) : (
            <div className={`flex-row items-center justify-center flex-1 ${styles.emptyState}`}>
              컴포넌트를 선택하세요
            </div>
          )}
        </div>
      )
    }

    if (tabData.contentType === 'code') {
      return <CodePanel entry={selectedEntry} />
    }

    if (tabData.contentType === 'chat') {
      return <ComponentChat entry={selectedEntry ?? null} />
    }

    return null
  }, [selectedName, selectedEntry])

  return (
    <div className={`flex-col ${styles.page}`} onKeyDown={handleLayoutKeyDown}>
      {/* Body: Workspace */}
      <div className={`flex-row ${styles.body}`}>
        <Workspace
          data={wsData}
          onChange={setWsData}
          renderPanel={renderPanel}
          aria-label="Component creator workspace"
        />
      </div>

      {/* Nav bar: Component tabs */}
      <div className={`flex-row shrink-0 items-center ${styles.navBar}`}>
        {componentRegistry.map((entry) => (
          <button
            key={entry.name}
            data-surface="action"
            className={`${styles.navTab}${entry.name === selectedName ? ` ${styles.navTabActive}` : ''}`}
            onClick={() => handleSelectComponent(entry.name)}
          >
            {entry.name}
          </button>
        ))}
      </div>
    </div>
  )
}
