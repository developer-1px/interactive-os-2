var e=`import { createDomainContext } from '@os/layout'
import type { Msg } from './incidentData'

export interface IncidentContextValue {
  items: Msg[]
  isStreaming: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  onReplay: () => void
}

export const [IncidentProvider, useIncident] = createDomainContext<IncidentContextValue>('Incident')
`;export{e as default};