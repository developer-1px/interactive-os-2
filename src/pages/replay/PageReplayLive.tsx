// ② replay-live-discuss — 활성 세션의 최신 이벤트를 SSE push로 실시간 반영 (raw JSON만)
// @useState-hatch — 세션 선택 상태는 OS 축에 없어 로컬 보유
import { useEffect, useMemo, useState } from 'react'
import { CodeViewer } from '@os/ui/CodeViewer'
import { Button } from '@os/ui/Button'
import { ScrollArea } from '@os/ui/ScrollArea'
import { StatusIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'
import { useActiveSessions } from './useActiveSessions'
import { useTimeline } from '../viewer/viewerStore'

export default function PageReplayLive() {
  const sessions = useActiveSessions({ activeOnly: false })
  const [sessionId, setSessionId] = useState<string | null>(null) // @useState-hatch

  useEffect(() => {
    if (sessionId) return
    const latest = [...sessions].sort((a, b) => b.mtime - a.mtime)[0]
    if (latest) setSessionId(latest.id)
  }, [sessions, sessionId])

  const events = useTimeline(sessionId ?? '')
  const latest = events[events.length - 1]

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.mtime - a.mtime),
    [sessions],
  )

  if (sortedSessions.length === 0) {
    return (
      <div className={ax({ layout: 'center', flex: '1' })}>
        No active sessions. Is the dev server running?
      </div>
    )
  }

  const code = latest === undefined ? '' : JSON.stringify(latest, null, 2)
  const session = sessions.find(s => s.id === sessionId)

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <ScrollArea orientation="horizontal">
        <div className={ax({ layout: 'bar' })}>
          {sortedSessions.map(doc => (
            <Button
              key={doc.id}
              variant={doc.id === sessionId ? 'accent' : 'ghost'}
              onClick={() => setSessionId(doc.id)}
            >
              {doc.active && <StatusIndicator tone="success" />}
              {doc.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'caption' })}>
          {session?.label ?? sessionId}  ·  {events.length} events
          {latest?.ts ? `  ·  latest ${latest.ts.slice(11, 19)}` : ''}
        </span>
      </div>

      <ScrollArea>
        <CodeViewer code={code} filename="latest-event.json" preset="doc" wrap />
      </ScrollArea>
    </div>
  )
}
