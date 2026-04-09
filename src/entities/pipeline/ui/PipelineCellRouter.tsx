import type { NodeState } from '@os/pattern/types'
import { PhaseCell } from '@os/ui/cells/PhaseCell'
import { TierCell } from '@os/ui/cells/TierCell'

type PhaseStatus = 'done' | 'wip' | 'empty'

export function PipelineCellRouter(
  _props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  column: { key: string },
  _state: NodeState,
) {
  if (column.key === 'name') {
    const v = value as { text: string; tier: string }
    return <TierCell text={v.text} tier={v.tier as 'need' | 'story' | 'feature' | 'screen'} />
  }
  return <PhaseCell status={value as PhaseStatus | null} />
}
