var e=`import { ax } from '@styles/ax'
import { StatusIndicator } from '../indicators'

interface VisualCellProps {
  thumbnail: string | null
  status: 'done' | 'wip' | 'empty'
}

const TONE_MAP = {
  done: 'success',
  wip: 'warning',
  empty: 'info',
} as const

export function VisualCell({ thumbnail, status }: VisualCellProps) {
  if (thumbnail) {
    return (
      <span className={ax({ layout: 'center' })}>
        <img
          src={thumbnail}
          alt=""
          width={48}
          height={32}
          className={ax({ shape: 'sm' })}
        />
      </span>
    )
  }
  return (
    <span className={ax({ layout: 'center' })}>
      <StatusIndicator tone={TONE_MAP[status]} />
    </span>
  )
}
`;export{e as default};