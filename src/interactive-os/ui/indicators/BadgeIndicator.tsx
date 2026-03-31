// ② 2026-03-28-ui-indicators-prd.md
interface BadgeIndicatorProps {
  count: number
  className?: string
}

export function BadgeIndicator({ count, className }: BadgeIndicatorProps) {
  if (count <= 0) return null
  const classes = ['inline-flex items-center justify-center shrink-0', 'item-indicator--badge', className].filter(Boolean).join(' ')
  return <span className={classes}>{count >= 100 ? '99+' : count}</span>
}
