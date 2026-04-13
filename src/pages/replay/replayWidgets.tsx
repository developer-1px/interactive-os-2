import { useMemo, useCallback } from 'react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { ViewerTabList } from '@os/ui/ViewerTabList'
import { TabList } from '@os/ui/TabList'
import { Combobox } from '@os/ui/Combobox'
import { Button } from '@os/ui/Button'
import { FileViewer } from '@os/ui/FileViewer'
import { SearchResults } from '@os/ui/SearchResults'
import { TerminalOutput } from '@os/ui/TerminalOutput'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { createStore } from '@os/store/createStore'
import { chatRenderers } from './replayRenderers'
import { LiveSessionPanel } from './LiveSessionPanel'
import { useReplay } from './replayContext'

// ── Viewer (left pane) ──

export function ReplayViewerWidget() {
  const { tabs, activeTab, activeTabId, setActiveTab, viewerTabData, fileViewerRef } = useReplay()

  return (
    <div className={ax({ layout: 'fill' })}>
      {tabs.length > 0 ? (
        <div className={ax({ scroll: 'x', flex: 'none' })}>
          <ViewerTabList
            data={viewerTabData}
            initialFocus={activeTabId ?? undefined}
            onActivate={(nodeId) => setActiveTab(nodeId)}
            aria-label="Viewer tabs"
          />
        </div>
      ) : (
        <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })}>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>Viewer</span>
        </div>
      )}

      <ScrollArea className={ax({ flex: '1', padding: 'sm' })}>
        {activeTab?.type === 'file' ? (
          <FileViewer ref={fileViewerRef} filename={filenameFrom(activeTab.path)} />
        ) : activeTab?.type === 'search' ? (
          <SearchResults query={activeTab.query} output={activeTab.output} />
        ) : activeTab?.type === 'terminal' ? (
          <TerminalOutput command={activeTab.command} output={activeTab.output} />
        ) : (
          <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
            tool_use steps will appear here during playback
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

// ── Chat (right pane) ──

export function ReplayChatWidget() {
  const { rightTab, rightTabData, handleRightTabActivate, selectedId, setSelectedId, sessionEntries, messages, isRunning, startReplay, viewerTabs, fileViewerRef } = useReplay()

  const sessionComboData = useMemo(() => {
    const entities = Object.fromEntries(
      sessionEntries.map(e => [e.id, { id: e.id, data: { label: `${e.id} (${e.type})` } }])
    )
    return createStore({ entities, relationships: { __root__: sessionEntries.map(e => e.id) } })
  }, [sessionEntries])

  const handleSessionChange = useCallback((data: unknown) => {
    const store = data as { entities: Record<string, { data?: { selected?: boolean } }> }
    for (const [id, entity] of Object.entries(store.entities)) {
      if (id.startsWith('__')) continue
      if ((entity.data as Record<string, unknown>)?.selected) {
        setSelectedId(id)
        return
      }
    }
  }, [setSelectedId])

  return (
    <div className={ax({ layout: 'fill' })}>
      <TabList
        data={rightTabData}
        initialFocus={rightTab}
        onActivate={handleRightTabActivate}
        aria-label="Chat mode"
      />

      {rightTab === 'replay' && (
        <div className={ax({ layout: 'fill' })}>
          <div className={ax({ layout: 'bar', gap: 'sm', padding: 'xs', flex: 'none' })}>
            <Combobox
              data={sessionComboData}
              placeholder={selectedId}
              onChange={handleSessionChange}
              aria-label="Session selector"
            />
            {!isRunning && messages.length > 0 && (
              <Button size="sm" onClick={startReplay}>Replay</Button>
            )}
          </div>
          <ChatFeed
            messages={messages}
            blockRenderers={chatRenderers}
            isStreaming={isRunning}
            className={ax({ flex: '1', padding: 'sm' })}
          />
        </div>
      )}

      {rightTab === 'live' && (
        <LiveSessionPanel viewerTabs={viewerTabs} fileViewerRef={fileViewerRef} />
      )}
    </div>
  )
}

// ── Helper ──

function filenameFrom(path: string | null): string {
  if (!path) return 'output'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'output'
}
