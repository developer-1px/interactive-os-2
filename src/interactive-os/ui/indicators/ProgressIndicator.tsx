// ② 2026-03-28-ui-indicators-prd.md
interface ProgressIndicatorProps {
  value: number
  max?: number
  className?: string
}

export function ProgressIndicator({ value, max = 100, className }: ProgressIndicatorProps) {
  const classes = ['item-indicator--progress', className].filter(Boolean).join(' ')
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={classes} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="item-indicator--progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
