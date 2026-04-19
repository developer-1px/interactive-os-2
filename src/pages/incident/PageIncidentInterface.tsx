// @useState-hatch
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ax } from '@styles/ax'
import './PageIncidentInterface.css'
import {
  Zap, CheckCircle, Loader, Bot, User,
} from 'lucide-react'
import { useStreamFeed } from '@os/ui/useStreamFeed'
import { useTypewriter } from '@os/ui/useTypewriter'
import { StreamFeed, StreamCursor } from '@os/ui/StreamFeed'
import { PanelHeader } from '@os/ui/PanelHeader'
import { Composer } from '@os/ui/Composer'
import { SERVICES, TIMELINE_EVENTS, MESSAGES } from './incidentMockData'
import type { Msg } from './incidentMockData'
import { MonitoringBar } from './MonitoringBar'
import { TimelinePanel } from './TimelinePanel'
import { CapturePanel } from './CapturePanel'

// ═══════════════════════════════════════════
// Small sub-components (< 50 lines each)
// ═══════════════════════════════════════════

function AgentMessage({ msg, active }: { msg: Msg; active: boolean }) {
  const { displayed, done } = useTypewriter(msg.text, active)
  return (
    <div className={ax({ layout: 'bar' })}>
      <div className={`${ax({ layout: 'center', tone: 'accent' })} incident-avatar`}><Bot size={14} /></div>
      <div className={ax({ layout: 'stack', flex: '1' })}>
        <div className={ax({ textStyle: 'caption' })}>
          {displayed}
          {!done && <StreamCursor />}
        </div>
        {done && msg.block && <msg.block />}
      </div>
    </div>
  )
}

function Elapsed({ startTime }: { startTime: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  if (!startTime) return null
  const sec = ((now - startTime) / 1000).toFixed(1)
  return <span>{sec}s</span>
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

export default function PageIncidentInterface() {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const { items, isStreaming, feedRef, addItems, clear } = useStreamFeed<Msg>({
    getDelay: (msg) => msg.delay,
  })

  // Auto-play on mount
  const didPlayRef = useRef(false)
  useEffect(() => {
    if (!didPlayRef.current) {
      didPlayRef.current = true
      addItems(MESSAGES)
    }
  }, [addItems])

  const replay = useCallback(() => {
    clear()
    addItems(MESSAGES)
  }, [clear, addItems])

  // Track timing
  const prevItemsLenRef = useRef(0)
  const len = items.length

  useEffect(() => {
    if (len >= 1 && prevItemsLenRef.current === 0) {
      queueMicrotask(() => { setStartTime(Date.now()); setEndTime(null) })
    }
    if (len === MESSAGES.length && prevItemsLenRef.current < MESSAGES.length) {
      queueMicrotask(() => setEndTime(Date.now()))
    }
    prevItemsLenRef.current = len
  }, [len])

  const handleReplay = useCallback(() => {
    prevItemsLenRef.current = 0
    setStartTime(null)
    setEndTime(null)
    setSelectedEvent(null)
    replay()
  }, [replay])

  // Progressive timeline reveal synced to chat progress
  const timelineVisible = Math.min(
    TIMELINE_EVENTS.length,
    len <= 2 ? 0 : len <= 4 ? 2 : len <= 6 ? 4 : len <= 8 ? 6 : TIMELINE_EVENTS.length,
  )

  // Auto-select latest event when timeline first appears
  const initialEventId = useMemo(
    () => timelineVisible > 0 ? TIMELINE_EVENTS[timelineVisible - 1]?.id ?? null : null,
    [timelineVisible],
  )

  if (initialEventId && !selectedEvent) setSelectedEvent(initialEventId)

  const handleToolbarActivate = useCallback((_id: string) => {
    // service selection — showcase only
  }, [])

  return (
    <div className={`incident-page grid h-full ${ax({ })}`}>
      {/* Zone 1: Monitoring Bar */}
      <MonitoringBar
        services={SERVICES}
        onActivate={handleToolbarActivate}
      />

      {/* Zone 2: Workspace (Timeline + Capture + Chat) */}
      <div className={ax({ layout: 'row', flex: '1' })}>
        <TimelinePanel
          events={TIMELINE_EVENTS}
          visibleCount={timelineVisible}
          selectedId={selectedEvent}
          onSelect={setSelectedEvent}
        />
        <CapturePanel selectedEventId={selectedEvent} />

        <div className={`${ax({
            role: 'control-group',
            surface: 'sunken', layout: 'stack', flex: 'none' })} incident-chat-zone`}>
          <PanelHeader axes={{ layout: 'spread' }}>
            <span className={ax({ layout: 'bar' })}><Bot size={12} />AI Analysis</span>
            <span className={ax({ layout: 'bar', textStyle: 'code' })}>
              {endTime
                ? <><CheckCircle size={10} /><span>{((endTime - (startTime ?? 0)) / 1000).toFixed(1)}s</span></>
                : startTime
                  ? <><Loader size={10} className={ax({ })} /><Elapsed startTime={startTime} /></>
                  : null
              }
            </span>
          </PanelHeader>
          <StreamFeed
            items={items}
            feedRef={feedRef}
            isStreaming={isStreaming}
            className={ax({ flex: '1' })}
            renderItem={(msg) => {
              if (msg.type === 'user') {
                return (
                  <div className={ax({ layout: 'bar' })}>
                    <div className={ax({ flex: '1' })}>
                      <div className={ax({ textStyle: 'caption' })}>{msg.text}</div>
                    </div>
                    <div className={`${ax({ layout: 'center' })} incident-user-avatar`}><User size={14} /></div>
                  </div>
                )
              }
              if (msg.type === 'system') {
                return (
                  <div className={ax({ surface: 'display' })}>
                    <div className={ax({ textStyle: 'caption', tone: 'danger' })}>{msg.text}</div>
                  </div>
                )
              }
              if (msg.type === 'tool') {
                return (
                  <div className={ax({ layout: 'bar', textStyle: 'code' })}>
                    <Zap size={10} />
                    <span className={ax({ })}>{msg.toolName}</span>
                    <span className={ax({ clamp: '2' })}>{msg.text}</span>
                  </div>
                )
              }
              return <AgentMessage msg={msg} active={true} />
            }}
          />
          <Composer
            placeholder="AI에게 질문하세요..."
            disabled={isStreaming}
            onSubmit={handleReplay}
          />
        </div>
      </div>
    </div>
  )
}
