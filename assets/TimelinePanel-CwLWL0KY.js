var e=`import { useCallback, useMemo } from 'react'
import { ax } from '@styles/ax'
import {
  AlertTriangle, GitCommit, Activity,
  CheckCircle, Terminal, Clock,
} from 'lucide-react'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { ROOT_ID } from '@os/store/types'
import { ListBox } from '@os/ui/ListBox'
import { PanelHeader } from '@os/ui/PanelHeader'
import type { TimelineEvent } from './incidentMockData'

const EVENT_ICON: Record<TimelineEvent['type'], React.ReactNode> = {
  deploy: <GitCommit size={12} />,
  alert: <AlertTriangle size={12} />,
  config: <Terminal size={12} />,
  metric: <Activity size={12} />,
  recovery: <CheckCircle size={12} />,
}

const SEVERITY_CLS: Record<TimelineEvent['severity'], string> = {
  critical: 'incident-ev-critical',
  warning: 'incident-ev-warning',
  info: 'incident-ev-info',
}

function buildTimelineData(events: TimelineEvent[], visibleCount: number): NormalizedData {
  const visible = events.slice(0, visibleCount)
  const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
  const children: string[] = []
  for (const ev of visible) {
    entities[ev.id] = { id: ev.id, data: { ...ev } }
    children.push(ev.id)
  }
  return { entities, relationships: { [ROOT_ID]: children } }
}

export function TimelinePanel({ events, visibleCount, selectedId, onSelect }: {
  events: TimelineEvent[]
  visibleCount: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const data = useMemo(() => buildTimelineData(events, visibleCount), [events, visibleCount])

  const renderItem = useCallback((
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    state: NodeState,
  ) => {
    const ev = node.data as unknown as TimelineEvent
    if (!ev) return <div {...props} />
    const isSelected = node.id === selectedId
    return (
      <div
        {...props}
        className={\`incident-timeline-item \${SEVERITY_CLS[ev.severity]} \${isSelected ? 'incident-timeline-item-selected' : ''} \${state.focused ? 'incident-timeline-item-focused' : ''}\`}
        onClick={(e) => {
          props.onClick?.(e)
          onSelect(node.id as string)
        }}
      >
        <div className={\`\${ax({ textStyle: 'code' })} incident-timeline-time\`}>{ev.time}</div>
        <div className={\`incident-timeline-dot \${ax({ layout: 'stack' })}\`}>
          <span className={\`incident-dot \${SEVERITY_CLS[ev.severity]}\`} />
          <span className={\`incident-dot-line \${ax({ flex: '1' })}\`} />
        </div>
        <div className={ax({ layout: 'bar', gap: 'xs', flex: '1' })}>
          <div className="incident-timeline-icon">{EVENT_ICON[ev.type]}</div>
          <div className={ax({ flex: '1' })}>
            <div className={ax({ textStyle: 'body', weight: 'medium' })}>{ev.title}</div>
            <div className={ax({ textStyle: 'caption', text: 'muted' })}>{ev.detail}</div>
          </div>
        </div>
      </div>
    )
  }, [selectedId, onSelect])

  return (
    <div className={\`\${ax({ surface: 'base', layout: 'stack', flex: 'none', placement: 'relative' })} incident-timeline-panel\`}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Clock size={12} />Timeline</span>
        <span className={ax({ textStyle: 'code' })}>{visibleCount}/{events.length}</span>
      </PanelHeader>
      {visibleCount > 0 ? (
        <ListBox
          data={data}
          plugins={[]}
          renderItem={renderItem}
          onActivate={onSelect}
          aria-label="Incident timeline"
        />
      ) : (
        <div className={ax({ textStyle: 'caption', text: 'muted', layout: 'center', flex: '1' })}>이벤트 수집 중...</div>
      )}
    </div>
  )
}
`;export{e as default};