import { ax } from '@styles/ax'
import { Bot, Eye, Image } from 'lucide-react'
import { PanelHeader } from '@os/ui/PanelHeader'
import { TIMELINE_EVENTS, CAPTURE_STATES } from './incidentMockData'

export function CapturePanel({ selectedEventId }: { selectedEventId: string | null }) {
  const capture = selectedEventId ? CAPTURE_STATES[selectedEventId] : null
  const event = selectedEventId ? TIMELINE_EVENTS.find(e => e.id === selectedEventId) : null

  return (
    <div className={`${ax({
        role: 'control-group',
        surface: 'sunken', layout: 'stack', flex: '1' })} incident-capture-panel`}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar' })}><Image size={12} />Capture</span>
        {event && <span className={ax({ textStyle: 'code' })}>{event.time}</span>}
      </PanelHeader>
      {capture ? (
        <div className={ax({ layout: 'stack', flex: '1' })}>
          <div className={`incident-capture-comparison grid ${ax({ })}`}>
            <div className={ax({ role: 'cell', surface: 'display', layout: 'stack' })}>
              <div className={ax({ textStyle: 'overline' })}>Before</div>
              <span className={ax({ textStyle: 'code' })}>{capture.before}</span>
            </div>
            <div className={`${ax({ role: 'cell', surface: 'display', layout: 'stack' })} incident-capture-changed`}>
              <div className={ax({ textStyle: 'overline' })}>After</div>
              <span className={`${ax({ textStyle: 'code' })} incident-capture-text`}>{capture.after}</span>
            </div>
          </div>
          <div className={ax({ role: 'item', layout: 'bar', textStyle: 'caption', tone: 'accent' })}>
            <Bot size={12} />
            <span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption' })}>
          <div className={ax({ layout: 'stack' })}>
            <Eye size={24} />
            <span>타임라인에서 이벤트를 선택하세요</span>
            <kbd>↑↓</kbd>
          </div>
        </div>
      )}
    </div>
  )
}
