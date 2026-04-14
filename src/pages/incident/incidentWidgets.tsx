// @useState-hatch — useFlatLayout + useStreamFeed 조합 실험
// FlatLayout widget 컴포넌트들 — Pull model (useIncident context + useFlatLayout shared state)
import { useCallback, useMemo, useRef, useEffect } from 'react'
import { Toolbar } from '@os/ui/Toolbar'
import { ListBox } from '@os/ui/ListBox'
import { PanelHeader } from '@os/ui/PanelHeader'
import { Composer } from '@os/ui/Composer'
import { StreamFeed, StreamCursor } from '@os/ui/StreamFeed'
import { useTypewriter } from '@os/ui/useTypewriter'
import { useFlatLayout } from '@os/ui/useFlatLayout'
import { getEntityData } from '@os/store/createStore'
import { ServiceItem } from '@os/ui/items/ServiceItem'
import { TimelineItem } from '@os/ui/items/TimelineItem'
import { ax } from '@styles/ax'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { incidentCommands } from './incidentCommands'
import type { Msg } from './incidentData'
import { TIMELINE_EVENTS, SERVICES, CAPTURE_STATES } from './incidentData'
import { useIncident } from './incidentContext'
import {
  Activity, Clock, Eye, Bot, User, Zap,
  CheckCircle, Loader, AlertTriangle, GitCommit, Terminal,
} from 'lucide-react'

// ═══════════════════════════════════════════
// MonitoringBar
// ═══════════════════════════════════════════

const TOOLBAR_DATA: NormalizedData = (() => {
  const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
  const children: string[] = []
  for (const svc of SERVICES) {
    entities[svc.name] = { id: svc.name, data: { ...svc, label: `${svc.name} ${svc.latency}` } }
    children.push(svc.name)
  }
  return { entities, relationships: { [ROOT_ID]: children } } as NormalizedData
})()

export function MonitoringBarWidget() {
  return (
    <div className={ax({ surface: 'base', layout: 'bar', gap: 'sm', padding: 'sm', flex: 'none' })}>
      <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'overline' })}><Activity size={12} /><span>Monitor</span></div>
      <Toolbar data={TOOLBAR_DATA} renderItem={ServiceItem} onActivate={() => {}} aria-label="Service monitoring" />
      <span className={ax({ textStyle: 'code', text: 'muted' })}>INC-1284</span>
    </div>
  )
}

// ═══════════════════════════════════════════
// Timeline — useFlatLayout으로 shared store 읽기 + command dispatch
// ═══════════════════════════════════════════

const EVENT_ICON: Record<string, React.ReactNode> = {
  deploy: <GitCommit size={12} />,
  alert: <AlertTriangle size={12} />,
  config: <Terminal size={12} />,
  metric: <Activity size={12} />,
  recovery: <CheckCircle size={12} />,
}

export function TimelinePanelWidget() {
  const { store, dispatch } = useFlatLayout()
  const shared = getEntityData<{ chatItemCount?: number; selectedEventId?: string }>(store, 'shared')
  const chatCount = shared?.chatItemCount ?? 0
  const selectedId = shared?.selectedEventId ?? null

  const visibleCount = Math.min(
    TIMELINE_EVENTS.length,
    chatCount <= 2 ? 0 : chatCount <= 4 ? 2 : chatCount <= 6 ? 4 : TIMELINE_EVENTS.length,
  )

  const data = useMemo(() => {
    const visible = TIMELINE_EVENTS.slice(0, visibleCount)
    const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
    const children: string[] = []
    for (const ev of visible) {
      entities[ev.id] = { id: ev.id, data: { ...ev, label: ev.title } }
      children.push(ev.id)
    }
    return { entities, relationships: { [ROOT_ID]: children } } as NormalizedData
  }, [visibleCount])

  const handleActivate = useCallback((id: string) => {
    dispatch(incidentCommands.selectEvent(id))
  }, [dispatch])

  // 새 이벤트가 나타나면 자동 선택
  const prevVisibleRef = useRef(0)
  useEffect(() => {
    if (visibleCount > prevVisibleRef.current && visibleCount > 0) {
      const latestId = TIMELINE_EVENTS[visibleCount - 1]?.id
      if (latestId) dispatch(incidentCommands.selectEvent(latestId))
    }
    prevVisibleRef.current = visibleCount
  }, [visibleCount, dispatch])

  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Clock size={12} />Timeline</span>
        <span className={ax({ textStyle: 'code' })}>{visibleCount}/{TIMELINE_EVENTS.length}</span>
      </PanelHeader>
      {visibleCount > 0 ? (
        <ListBox
          data={data}
          plugins={[]}
          renderItem={(props, node, state) => {
            const ev = node.data as Record<string, unknown> | undefined
            const isIncidentSelected = node.id === selectedId
            return TimelineItem(props, node, { ...state, selected: isIncidentSelected }, {
              icon: EVENT_ICON[(ev?.type as string) ?? ''],
              time: ev?.time as string,
              detail: ev?.detail as string,
            })
          }}
          onActivate={handleActivate}
          aria-label="Incident timeline"
        />
      ) : (
        <div className={ax({ textStyle: 'caption', text: 'muted', layout: 'center', flex: '1' })}>이벤트 수집 중...</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Capture — useFlatLayout으로 selectedEventId 읽기
// ═══════════════════════════════════════════

export function CapturePanelWidget() {
  const { store } = useFlatLayout()
  const shared = getEntityData<{ selectedEventId?: string }>(store, 'shared')
  const id = shared?.selectedEventId ?? null
  const capture = id ? CAPTURE_STATES[id] : null
  const event = id ? TIMELINE_EVENTS.find((e) => e.id === id) : null

  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Eye size={12} />Capture</span>
        {event && <span className={ax({ textStyle: 'code' })}>{event.time}</span>}
      </PanelHeader>
      {capture ? (
        <div className={ax({ layout: 'column', flex: '1', gap: 'md', padding: 'sm' })}>
          <div className={ax({ layout: 'grid-2', gap: 'sm' })}>
            <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'column', gap: 'sm' })}>
              <div className={ax({ textStyle: 'overline', weight: 'semi' })}>Before</div>
              <span className={ax({ textStyle: 'code', weight: 'semi' })}>{capture.before}</span>
            </div>
            <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'column', gap: 'sm' })}>
              <div className={ax({ textStyle: 'overline', weight: 'semi' })}>After</div>
              <span className={ax({ textStyle: 'code', weight: 'semi' })}>{capture.after}</span>
            </div>
          </div>
          <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', tone: 'accent' })}>
            <Bot size={12} /><span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption', text: 'muted' })}>
          <div className={ax({ layout: 'column', gap: 'sm' })}><Eye size={24} /><span>타임라인에서 이벤트를 선택하세요</span></div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Chat — items를 props로 받되, chatItemCount를 command로 store sync
// ═══════════════════════════════════════════

function AgentMessage({ msg, active }: { msg: Msg; active: boolean }) {
  const { displayed, done } = useTypewriter(msg.text, active)
  return (
    <div className={ax({ layout: 'bar', gap: 'sm' })}>
      <div className={ax({ role: 'control', layout: 'center', tone: 'accent' })}><Bot size={14} /></div>
      <div className={ax({ layout: 'column', flex: '1', gap: 'sm' })}>
        <div className={ax({ textStyle: 'caption', text: 'primary' })}>{displayed}{!done && <StreamCursor />}</div>
        {done && msg.block && <msg.block />}
      </div>
    </div>
  )
}

function chatRenderItem(msg: Msg) {
  if (msg.type === 'user') {
    return (
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption', weight: 'medium' })}>{msg.text}</div></div>
        <div className={ax({ role: 'control', layout: 'center' })}><User size={14} /></div>
      </div>
    )
  }
  if (msg.type === 'system') {
    return <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}><div className={ax({ textStyle: 'caption', weight: 'semi', tone: 'danger' })}>{msg.text}</div></div>
  }
  if (msg.type === 'tool') {
    return (
      <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'code' })}>
        <Zap size={10} /><span className={ax({ weight: 'semi' })}>{msg.toolName}</span><span className={ax({ text: 'muted', clamp: '2' })}>{msg.text}</span>
      </div>
    )
  }
  return <AgentMessage msg={msg} active={true} />
}

export function ChatZoneWidget() {
  const { dispatch } = useFlatLayout()
  const { items: msgItems, isStreaming: streaming, feedRef, onReplay } = useIncident()

  // items.length 변경 → store에 chatItemCount sync
  const prevLenRef = useRef(0)
  useEffect(() => {
    if (msgItems.length !== prevLenRef.current) {
      prevLenRef.current = msgItems.length
      dispatch(incidentCommands.setChatProgress(msgItems.length))
    }
  }, [msgItems.length, dispatch])

  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Bot size={12} />AI Analysis</span>
        <span className={ax({ layout: 'bar', gap: 'xs', textStyle: 'code' })}>
          {streaming ? <Loader size={10} className={ax({ motion: 'spin' })} /> : msgItems.length > 0 ? <CheckCircle size={10} /> : null}
        </span>
      </PanelHeader>
      <StreamFeed
        items={msgItems}
        feedRef={feedRef}
        isStreaming={streaming}
        className={ax({ flex: '1', gap: 'sm', padding: 'sm' })}
        renderItem={chatRenderItem}
      />
      <Composer placeholder="AI에게 질문하세요..." disabled={streaming} onSubmit={onReplay} />
    </div>
  )
}
