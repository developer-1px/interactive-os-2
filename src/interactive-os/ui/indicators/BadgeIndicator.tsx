// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface BadgeIndicatorProps {
  count: number
  className?: string
}

export function BadgeIndicator({ count, className }: BadgeIndicatorProps) {
  if (count <= 0) return null
  const classes = [
    ax({ recipe: 'badge', flex: 'none', surface: 'display', tone: 'danger', padding: 'xs', gap: 'xs', shape: 'pill', layout: 'row', content: 'text', clamp: '1' }),
    'item-indicator--badge',
    className,
  ].filter(Boolean).join(' ')
  return <span className={classes}>{count >= 100 ? '99+' : count}</span>
}
