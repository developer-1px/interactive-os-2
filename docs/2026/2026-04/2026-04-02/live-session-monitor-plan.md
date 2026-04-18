---
id: 2-areas/engine/prds/live-session-monitor-plan
type: plan
slug: liveSessionMonitor
title: Live Session Monitor Implementation Plan
tags: [untagged]
created: 2026-04-02
updated: 2026-04-08
summary: '**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.'
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Live Session Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Live 탭에서 활성 CLI 세션 목록을 탭으로 보여주고, 선택한 세션의 ChatFeed + 코드 뷰어를 실시간 스트리밍한다.

**Architecture:** `/api/agent-ops/sessions` polling으로 활성 세션 목록을 가져오고, 선택된 세션은 `viewerStore.connectSession(id, true)`로 SSE 구독한다. `timelineToMessages`로 ChatFeed에 표시하고, `trackEditRanges`로 코드 뷰어 파일 탭/하이라이트를 실시간 반영한다.

**Tech Stack:** React, useSyncExternalStore, SSE, viewerStore, timelineAdapter

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/pages/replay/useActiveSessions.ts` | Create | `/api/agent-ops/sessions` polling hook |
| `src/pages/replay/LiveSessionPanel.tsx` | Create | 세션 탭 + ChatFeed + 코드 뷰어 연동 컴포넌트 |
| `src/pages/replay/PageReplay.tsx` | Modify | Live 탭을 ChatPane → LiveSessionPanel로 교체 |

---

### Task 1: useActiveSessions hook

**Files:**
- Create: `src/pages/replay/useActiveSessions.ts`

- [ ] **Step 1: Create useActiveSessions hook**

```ts
// src/pages/replay/useActiveSessions.ts
import { useState, useEffect } from 'react'

export interface ActiveSession {
  id: string
  label: string
  mtime: number
  active: boolean
}

const POLL_INTERVAL = 10_000

export function useActiveSessions(): ActiveSession[] {
  const [sessions, setSessions] = useState<ActiveSession[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/agent-ops/sessions')
        if (!res.ok) return
        const data: ActiveSession[] = await res.json()
        if (!cancelled) setSessions(data.filter(s => s.active))
      } catch { /* server unavailable */ }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return sessions
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/replay/useActiveSessions.ts
git commit -m "feat: useActiveSessions polling hook"
```

---

### Task 2: LiveSessionPanel component

**Files:**
- Create: `src/pages/replay/LiveSessionPanel.tsx`

이 컴포넌트는 `TimelineColumn`의 store 연동 패턴을 재사용하되, PageReplay의 코드 뷰어 state를 직접 업데이트한다.

- [ ] **Step 1: Create LiveSessionPanel**

```tsx
// src/pages/replay/LiveSessionPanel.tsx
import { useEffect, useMemo, useCallback } from 'react'
import { connectSession, disconnectSession, useTimeline, useSessionMeta, getEditRanges } from '../viewer/viewerStore'
import { timelineToMessages } from '../viewer/timelineAdapter'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { ThinkingBlock } from '@os/ui/chat/ThinkingBlock'
import { ToolSummaryBlock, ToolResultBlock } from '@os/ui/chat/ToolSummaryBlock'
import type { BlockRendererMap } from '@os/ui/chat/types'
import type { HighlightTone } from '@os/ui/CodeBlock'
import { ax } from '@styles/ax'
import { useActiveSessions, type ActiveSession } from './useActiveSessions'
import { fetchFile } from '../viewer/fsClient'

const chatRenderers: BlockRendererMap = {
  thinking: ThinkingBlock,
  tool_summary: ToolSummaryBlock,
  tool_use: ToolSummaryBlock,
  tool_result: ToolResultBlock,
}

interface LiveSessionPanelProps {
  onViewerUpdate: (files: Map<string, string>, activeFile: string | null, highlights?: Map<number, HighlightTone>) => void
}

export function LiveSessionPanel({ onViewerUpdate }: LiveSessionPanelProps) {
  const activeSessions = useActiveSessions()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-select first session if none selected or selected disappeared
  useEffect(() => {
    if (activeSessions.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !activeSessions.find(s => s.id === selectedId)) {
      setSelectedId(activeSessions[0].id)
    }
  }, [activeSessions, selectedId])

  return (
    <div className={ax({ layout: 'fill' })}>
      {/* Session tabs */}
      <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })} role="tablist">
        {activeSessions.map(s => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === selectedId}
            onClick={() => setSelectedId(s.id)}
            className={ax({
              surface: s.id === selectedId ? 'display' : 'ghost',
              controlSize: 'sm',
              textStyle: 'caption',
              tone: s.id === selectedId ? 'accent' : undefined,
            })}
          >
            {s.label}
          </button>
        ))}
        {activeSessions.length === 0 && (
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>활성 세션 없음</span>
        )}
      </div>

      {/* Selected session feed */}
      {selectedId && (
        <LiveFeed
          key={selectedId}
          sessionId={selectedId}
          onViewerUpdate={onViewerUpdate}
        />
      )}
    </div>
  )
}

// --- Inner component: manages one session's lifecycle ---

import { useState } from 'react'

function LiveFeed({ sessionId, onViewerUpdate }: { sessionId: string; onViewerUpdate: LiveSessionPanelProps['onViewerUpdate'] }) {
  useEffect(() => {
    connectSession(sessionId, true)
    return () => disconnectSession(sessionId)
  }, [sessionId])

  const timeline = useTimeline(sessionId)
  const { agentStatus, fetchError, initialLoading } = useSessionMeta(sessionId)
  const messages = useMemo(() => timelineToMessages(timeline), [timeline])

  // Sync code viewer with latest tool_use events
  useEffect(() => {
    if (timeline.length === 0) return

    const files = new Map<string, string>()
    let lastFilePath: string | null = null

    for (const evt of timeline) {
      if (evt.type !== 'tool_use' || !evt.filePath) continue
      if (evt.tool === 'Edit' || evt.tool === 'Write' || evt.tool === 'Read') {
        lastFilePath = evt.filePath
        // editNew contains the new content for Edit/Write
        if (evt.editNew) {
          files.set(evt.filePath, evt.editNew)
        } else if (!files.has(evt.filePath)) {
          files.set(evt.filePath, '') // placeholder, will fetch
        }
      }
    }

    // Fetch actual file content for files we only have placeholders for
    const toFetch = [...files.entries()].filter(([, v]) => v === '')
    if (toFetch.length > 0) {
      Promise.all(toFetch.map(async ([p]) => {
        try {
          const content = await fetchFile(p)
          if (content) files.set(p, content)
        } catch { /* unavailable */ }
      })).then(() => {
        onViewerUpdate(new Map(files), lastFilePath)
      })
    } else if (files.size > 0) {
      onViewerUpdate(files, lastFilePath)
    }
  }, [timeline, onViewerUpdate])

  return (
    <>
      {fetchError ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          Failed to load: {fetchError}
        </div>
      ) : initialLoading ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          Loading...
        </div>
      ) : messages.length === 0 ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          에이전트 활동 대기중...
        </div>
      ) : (
        <ChatFeed
          messages={messages}
          blockRenderers={chatRenderers}
          isStreaming={agentStatus === 'running'}
          streamingLabel="Thinking"
          className={ax({ flex: '1' })}
        />
      )}
    </>
  )
}
```

**Note:** `useState` import를 파일 상단으로 옮겨야 함 (위는 설명용 구조).

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/replay/LiveSessionPanel.tsx
git commit -m "feat: LiveSessionPanel — active CLI session monitor"
```

---

### Task 3: PageReplay Live 탭 교체

**Files:**
- Modify: `src/pages/replay/PageReplay.tsx`

ChatPane를 LiveSessionPanel로 교체하고, onViewerUpdate 콜백으로 코드 뷰어 state를 연결한다.

- [ ] **Step 1: Replace Live tab imports and state**

제거할 것:
- `const ChatPane = lazy(...)` import
- `liveSessionId` state + `useEffect` (chatStore.createSession)
- `Suspense` + `ChatPane` 렌더링

추가할 것:
- `import { LiveSessionPanel } from './LiveSessionPanel'`

- [ ] **Step 2: Add onViewerUpdate callback**

```tsx
const onViewerUpdate = useCallback((files: Map<string, string>, activeFilePath: string | null) => {
  setOpenFiles(files)
  setActiveFile(activeFilePath)
  setHighlights(undefined)
  setCursorLine(null)
}, [])
```

- [ ] **Step 3: Replace Live tab render**

기존:
```tsx
{rightTab === 'live' && liveSessionId && (
  <Suspense fallback={...}>
    <ChatPane sessionId={liveSessionId} />
  </Suspense>
)}
```

교체:
```tsx
{rightTab === 'live' && (
  <LiveSessionPanel onViewerUpdate={onViewerUpdate} />
)}
```

- [ ] **Step 4: Clean up unused imports**

제거: `lazy`, `Suspense` (replay에서도 안 쓰면), `liveSessionId` state, chatStore auto-create useEffect.

Live 탭 클릭 핸들러에서도 chatStore.createSession 로직 제거 — viewer state 초기화만 유지.

- [ ] **Step 5: Verify typecheck + dev server**

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm dev` — Live 탭 전환 시 활성 세션 탭 표시 확인

- [ ] **Step 6: Commit**

```bash
git add src/pages/replay/PageReplay.tsx
git commit -m "feat: Live tab shows active CLI sessions instead of chat"
```

---

### Task 4: 코드 뷰어 실시간 파일 업데이트 개선

**Files:**
- Modify: `src/pages/replay/LiveSessionPanel.tsx`

현재 LiveFeed의 코드 뷰어 동기화는 editNew만 사용하는데, Read 이벤트의 경우 서버에서 실제 파일을 가져와야 한다. 또한 Edit의 경우 이전 파일 내용에 diff를 적용해야 정확하다.

- [ ] **Step 1: Improve file content tracking**

LiveFeed의 timeline→viewer 동기화를 개선:
- Read: fetchFile로 현재 파일 내용 가져오기
- Edit: editOld→editNew 치환 (이전 content에서)
- Write: editNew가 전체 파일 내용

```tsx
// LiveFeed 내부 — timeline 변경 시 코드 뷰어 동기화
useEffect(() => {
  if (timeline.length === 0) return

  const files = new Map<string, string>()
  let lastFilePath: string | null = null
  const fetchNeeded = new Set<string>()

  for (const evt of timeline) {
    if (evt.type !== 'tool_use' || !evt.filePath) continue
    lastFilePath = evt.filePath

    if (evt.tool === 'Read') {
      fetchNeeded.add(evt.filePath)
    } else if (evt.tool === 'Write' && evt.editNew) {
      files.set(evt.filePath, evt.editNew)
      fetchNeeded.delete(evt.filePath)
    } else if (evt.tool === 'Edit' && evt.editOld && evt.editNew) {
      const prev = files.get(evt.filePath) ?? ''
      files.set(evt.filePath, prev.replace(evt.editOld, evt.editNew))
      fetchNeeded.delete(evt.filePath)
    }
  }

  if (fetchNeeded.size > 0) {
    Promise.all([...fetchNeeded].map(async (p) => {
      try {
        const content = await fetchFile(p)
        if (content) files.set(p, content)
      } catch { /* unavailable */ }
    })).then(() => {
      onViewerUpdate(new Map(files), lastFilePath)
    })
  } else if (files.size > 0) {
    onViewerUpdate(files, lastFilePath)
  }
}, [timeline, onViewerUpdate])
```

- [ ] **Step 2: Verify with dev server**

Run: `pnpm dev` — CLI 세션에서 Edit/Read/Write 수행 시 코드 뷰어 업데이트 확인

- [ ] **Step 3: Commit**

```bash
git add src/pages/replay/LiveSessionPanel.tsx
git commit -m "fix: improve live file content tracking for Read/Edit/Write"
```
