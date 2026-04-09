// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface TreeConnectorProps {
  level: number
  isLast?: boolean
  className?: string
}

export function TreeConnector({ level, isLast, className }: TreeConnectorProps) {
  if (level <= 0) return null
  const classes = [
    `inline-block h-full shrink-0 ${ax({ placement: 'relative' })}`,
    'item-indicator--tree-connector',
    isLast ? 'item-indicator--tree-connector-last' : '',
    className,
  ].filter(Boolean).join(' ')
  return <span className={classes} />
}
