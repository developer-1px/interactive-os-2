import { ax } from '@styles/ax'
import { Bot, Eye, Image } from 'lucide-react'
import { PanelHeader } from '@os/ui/PanelHeader'
import { TIMELINE_EVENTS, CAPTURE_STATES } from './incidentMockData'

export function CapturePanel({ selectedEventId }: { selectedEventId: string | null }) {
  const capture = selectedEventId ? CAPTURE_STATES[selectedEventId] : null
  const event = selectedEventId ? TIMELINE_EVENTS.find(e => e.id === selectedEventId) : null

  return (
    <div className={`${ax({ surface: 'sunken', layout: 'stack', flex: '1' })} incident-capture-panel`}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Image size={12} />Capture</span>
        {event && <span className={ax({ textStyle: 'code' })}>{event.time}</span>}
      </PanelHeader>
      {capture ? (
        <div className={ax({ layout: 'stack', flex: '1', gap: 'md', padding: 'sm' })}>
          <div className={`incident-capture-comparison grid ${ax({ gap: 'sm' })}`}>
            <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'stack', gap: 'sm' })}>
              <div className={ax({ textStyle: 'overline', weight: 'semi' })}>Before</div>
              <span className={ax({ textStyle: 'code', weight: 'semi' })}>{capture.before}</span>
            </div>
            <div className={`${ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'stack', gap: 'sm' })} incident-capture-changed`}>
              <div className={ax({ textStyle: 'overline', weight: 'semi' })}>After</div>
              <span className={`${ax({ textStyle: 'code', weight: 'semi' })} incident-capture-text`}>{capture.after}</span>
            </div>
          </div>
          <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', tone: 'accent' })}>
            <Bot size={12} />
            <span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption', text: 'muted' })}>
          <div className={ax({ layout: 'stack', gap: 'sm' })}>
            <Eye size={24} />
            <span>타임라인에서 이벤트를 선택하세요</span>
            <kbd>↑↓</kbd>
          </div>
        </div>
      )}
    </div>
  )
}
