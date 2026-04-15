// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface ProgressIndicatorProps {
  value: number
  max?: number
  className?: string
}

export function ProgressIndicator({ value, max = 100, className }: ProgressIndicatorProps) {
  const classes = [
    ax({ width: 'full', scroll: 'hidden', shape: 'pill' }),
    'item-indicator--progress',
    className,
  ].filter(Boolean).join(' ')
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={classes} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full item-indicator--progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
