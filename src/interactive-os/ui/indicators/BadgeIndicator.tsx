// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface BadgeIndicatorProps {
  count: number
  className?: string
}

export function BadgeIndicator({ count, className }: BadgeIndicatorProps) {
  if (count <= 0) return null
  const classes = [`inline-flex ${ax({ layout: 'center', flex: 'none' })}`, 'item-indicator--badge', className].filter(Boolean).join(' ')
  return <span className={classes}>{count >= 100 ? '99+' : count}</span>
}
