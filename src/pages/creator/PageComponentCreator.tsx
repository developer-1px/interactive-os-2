// ② 2026-03-28-workspace-sync-prd.md

import { useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { componentRegistry, type RegistryEntry } from './componentRegistry'
import { ComponentCanvas } from './widgets/ComponentCanvas'
import { ComponentChat } from './widgets/ComponentChat'
import { CodePanel } from './widgets/CodePanel'
import { Workspace } from '@os/ui/Workspace'
import { TabList } from '@os/ui/TabList'
import { addEntity } from '@os/store/createStore'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import type { TabData } from '@os/plugins/workspaceStore'
import { useKeyMap } from '@os/primitives/useKeyMap'
import { ax } from '@styles/ax'
import { PanelHeader } from '@os/ui/PanelHeader'
import './PageComponentCreator.css'

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

// --- Component nav data ---

const componentNavData: NormalizedData = (() => {
  let s = createStore()
  for (const entry of componentRegistry) {
    s = addEntity(s, { id: entry.name, data: { label: entry.name } }, ROOT_ID)
  }
  return s
})()

function nameFromParams(params: Record<string, string | undefined>): string {
  const segment = (params['*'] ?? '').split('/')[0]
  return componentRegistry.find((e) => e.name === segment)?.name ?? componentRegistry[0]?.name ?? ''
}

export default function PageComponentCreator() {
  const params = useParams()
  const navigate = useNavigate()

  const selectedName = nameFromParams(params)

  const selectedEntry: RegistryEntry | undefined = useMemo(
    () => componentRegistry.find((e) => e.name === selectedName),
    [selectedName],
  )

  const handleSelectComponent = useCallback(
    (name: string) => {
      navigate(`/creator/${name}`)
    },
    [navigate],
  )

  const [wsData, setWsData] = useStore(() => createCreatorWorkspace())

  const { onKeyDown: handleLayoutKeyDown } = useKeyMap({})

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentType) return null

    if (tabData.contentType === 'canvas') {
      return (
        <div className="flex-col h-full overflow-hidden">
          <PanelHeader axes={{ textStyle: 'caption' }}>
            <span className={ax({ weight: 'semi', text: 'primary' })}>{selectedName || 'Select'}</span>
          </PanelHeader>
          {selectedEntry ? (
            <ComponentCanvas entry={selectedEntry} />
          ) : (
            <div className={`flex-row items-center justify-center flex-1 ${ax({ textStyle: 'body', text: 'muted' })} creator-empty-state`}>
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
    <div className="flex-col h-full overflow-hidden" onKeyDown={handleLayoutKeyDown}>
      {/* Body: Workspace */}
      <div className="flex-row flex-1 min-h-0">
        <Workspace
          data={wsData}
          onChange={setWsData}
          renderPanel={renderPanel}
          aria-label="Component creator workspace"
        />
      </div>

      {/* Nav bar: Component tabs */}
      <div className={`${ax({ surface: 'sunken', padding: 'xs' })} shrink-0 overflow-x-auto creator-nav-bar`}>
        <TabList
          data={componentNavData}
          plugins={[]}
          onActivate={handleSelectComponent}
          initialFocus={selectedName}
          aria-label="Component list"
        />
      </div>
    </div>
  )
}
