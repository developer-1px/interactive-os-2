// ② 2026-03-28-ui-indicators-prd.md
interface OverflowIndicatorProps {
  count: number
  className?: string
}

export function OverflowIndicator({ count, className }: OverflowIndicatorProps) {
  if (count <= 0) return null
  const classes = ['item-indicator--overflow', className].filter(Boolean).join(' ')
  return <span className={classes}>+{count}</span>
}
