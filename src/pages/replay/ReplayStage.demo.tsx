/* eslint-disable react-refresh/only-export-components */
// Full demo for the Replay Shorts stage — exercises every stage type
// (Code / Terminal / Search / Markdown live) with a mock ReplayContext.
import { useMemo, useRef, useState } from 'react'
import { ax } from '@styles/ax'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayStageWidget } from './replayWidgets'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import type { ChatMessage } from '@os/ui/chat/types'

export const meta = {
  slug: 'replay-stage',
  category: 'page',
  label: 'ReplayStage (Shorts)',
}

type Scenario = 'code' | 'terminal' | 'search' | 'live'

const SAMPLE_CODE = `import { ax } from '@styles/ax'

export function Hello() {
  return (
    <div className={ax({ surface: 'base', padding: 'md' })}>
      Hello, world!
    </div>
  )
}
`

const SAMPLE_SEARCH_OUTPUT = [
  'src/pages/replay/PageReplay.tsx:69:  const [mode] = useState<"replay" | "live">("replay")',
  'src/pages/replay/replayWidgets.tsx:150:  const liveMessages = useLiveMessages(...)',
  'src/pages/replay/LiveSessionPanel.tsx:24:  const activeSessions = useActiveSessions()',
].join('\n')

const SAMPLE_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'user', blocks: [{ id: 'b1', type: 'text', content: 'replay 데모 만들어봐' }] },
  { id: 'm2', role: 'assistant', blocks: [{ id: 'b2', type: 'text', content: '네, **Shorts 스테이지** 전 시나리오를 커버하는 데모를 추가합니다.' }] },
  { id: 'm3', role: 'system', blocks: [{ id: 'b3', type: 'tool_use', data: { name: 'Read', input: { file_path: 'src/pages/replay/PageReplay.tsx' } } }] },
  { id: 'm4', role: 'assistant', blocks: [{ id: 'b4', type: 'text', content: 'CodeStage / TerminalStage / SearchStage / MarkdownStage 네 가지를 한 화면에서 전환할 수 있게 했습니다.' }] },
] as unknown as ChatMessage[]

import type { FileTab, SearchTab, TerminalTab } from '@os/ui/viewerTypes'
const FILE_TAB: FileTab = { type: 'file', id: 'demo/Hello.tsx', path: 'demo/Hello.tsx', content: SAMPLE_CODE }
const TERMINAL_TAB: TerminalTab = { type: 'terminal', id: 'term-1', command: 'pnpm typecheck', output: '✓ no type errors\n  Time: 2.4s' }
const SEARCH_TAB: SearchTab = { type: 'search', id: 'search-1', query: 'useLiveMessages', output: SAMPLE_SEARCH_OUTPUT }

function useMockCtx(scenario: Scenario): ReplayContextValue {
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const activeTab: ViewerTab | null =
    scenario === 'code' ? FILE_TAB
    : scenario === 'terminal' ? TERMINAL_TAB
    : scenario === 'search' ? SEARCH_TAB
    : null

  const tabs = activeTab ? [activeTab] : []
  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: t.id } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  const noop = () => {}
  const viewerTabs = {
    tabs, activeTabId: activeTab?.id ?? null, activeTab,
    setActiveTab: noop,
    openFile: () => FILE_TAB,
    openSearch: () => SEARCH_TAB,
    openTerminal: () => TERMINAL_TAB,
    markEdited: noop,
    editedPaths: new Set<string>(),
    clear: noop,
  }

  return {
    selectedId: 'demo', setSelectedId: noop, sessionEntries: [],
    messages: SAMPLE_MESSAGES, allMessagesCount: SAMPLE_MESSAGES.length,
    isRunning: scenario === 'live', startReplay: noop, editingLine: null,
    mode: scenario === 'live' ? 'live' : 'replay',
    liveSessionId: null,
    tabs, activeTab, activeTabId: activeTab?.id ?? null, setActiveTab: noop,
    viewerTabData, fileViewerRef, viewerTabs,
  }
}

function StageFrame({ scenario }: { scenario: Scenario }) {
  const ctx = useMockCtx(scenario)
  return (
    <div style={{ height: 560, width: 320, flex: 'none' }}>
      <ReplayProvider value={ctx}>
        <ReplayStageWidget />
      </ReplayProvider>
    </div>
  )
}

export function Demo() {
  const [scenario, setScenario] = useState<Scenario>('code')
  const scenarios: Scenario[] = ['code', 'terminal', 'search', 'live']

  return (
    <div className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs' })}>
        {scenarios.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            className={ax({
              interactive: 'button', padding: 'xs', shape: 'sm',
              surface: scenario === s ? 'raised' : 'ghost',
              weight: scenario === s ? 'semi' : undefined,
            })}
          >{s}</button>
        ))}
      </div>
      <StageFrame scenario={scenario} />
    </div>
  )
}
