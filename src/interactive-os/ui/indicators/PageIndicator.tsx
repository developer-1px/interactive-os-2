// ② 2026-03-28-ui-indicators-prd.md
interface PageIndicatorProps {
  total: number
  current: number
  className?: string
}

export function PageIndicator({ total, current, className }: PageIndicatorProps) {
  if (total <= 0) return null
  const clamped = Math.min(Math.max(0, current), total - 1)
  const classes = ['item-indicator--page', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`item-indicator--page-dot${i === clamped ? ' item-indicator--page-dot-active' : ''}`}
        />
      ))}
    </span>
  )
}
