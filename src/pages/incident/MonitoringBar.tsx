import { useCallback, useMemo } from 'react'
import { ax } from '@styles/ax'
import { Activity } from 'lucide-react'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { ROOT_ID } from '@os/store/types'
import { Toolbar } from '@os/ui/Toolbar'
import type { ServiceInfo } from './incidentMockData'

const STATUS_CLS: Record<ServiceInfo['status'], string> = {
  critical: 'incident-indicator-critical',
  warning: 'incident-indicator-warning',
  healthy: 'incident-indicator-healthy',
}

function buildToolbarData(services: ServiceInfo[]): NormalizedData {
  const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
  const children: string[] = []
  for (const svc of services) {
    entities[svc.name] = { id: svc.name, data: { ...svc, label: svc.name } }
    children.push(svc.name)
  }
  return { entities, relationships: { [ROOT_ID]: children } }
}

export function MonitoringBar({ services, onActivate }: {
  services: ServiceInfo[]
  onActivate: (id: string) => void
}) {
  const data = useMemo(() => buildToolbarData(services), [services])

  const renderItem = useCallback((
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    _state: NodeState,
  ) => {
    const svc = node.data as unknown as ServiceInfo
    if (!svc) return <span {...props} />
    return (
      <span
        {...props}
        className={ax({ role: 'control', surface: 'ghost', content: 'text', layout: 'bar' })}
      >
        <span className={`incident-indicator ${STATUS_CLS[svc.status]}`} />
        <span className={ax({ })}>{svc.name}</span>
        <span className={ax({ textStyle: 'code' })}>{svc.latency}</span>
      </span>
    )
  }, [])

  return (
    <div className={ax({
        role: 'control-group',
        surface: 'base', layout: 'bar', flex: 'none' })}>
      <div className={ax({ layout: 'bar', textStyle: 'overline' })}><Activity size={12} /><span>Monitor</span></div>
      <Toolbar
        data={data}
        renderItem={renderItem}
        onActivate={onActivate}
        aria-label="Service monitoring"
      />
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'code' })}>INC-1284</span>
        <span className={`${ax({ role: 'item', textStyle: 'code', tone: 'danger' })} incident-monitor-meta-live`}>REC</span>
      </div>
    </div>
  )
}
