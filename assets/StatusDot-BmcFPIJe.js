var e=`import { StatusIndicator } from '@os/ui/indicators/StatusIndicator'
import type { BehaviorStatus } from '../storyTypes'

const toneMap: Record<BehaviorStatus, 'success' | 'warning' | 'info'> = {
  done: 'success',
  wip: 'warning',
  todo: 'info',
}

export function StatusDot({ status }: { status: BehaviorStatus }) {
  return <StatusIndicator tone={toneMap[status]} />
}
`;export{e as default};