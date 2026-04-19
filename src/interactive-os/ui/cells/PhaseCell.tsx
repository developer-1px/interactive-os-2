import { ax } from '@styles/ax'
import { StatusIndicator } from '../indicators'

type PhaseStatus = 'done' | 'wip' | 'empty'

interface PhaseCellProps {
  status: PhaseStatus | null
}

const TONE_MAP = {
  done: 'success',
  wip: 'warning',
  empty: 'info',
} as const

export function PhaseCell({ status }: PhaseCellProps) {
  if (status === null) return <span />
  return (
    <span className={ax({ role: 'cell', surface: 'display', layout: 'center' })}>
      <StatusIndicator tone={TONE_MAP[status]} />
    </span>
  )
}
