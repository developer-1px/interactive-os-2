// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface PageIndicatorProps {
  total: number
  current: number
  className?: string
}

export function PageIndicator({ total, current, className }: PageIndicatorProps) {
  if (total <= 0) return null
  const clamped = Math.min(Math.max(0, current), total - 1)
  const classes = [`inline-flex ${ax({ layout: 'bar', gap: 'xs' })}`, 'item-indicator--page', className].filter(Boolean).join(' ')
  const dotClass = ax({ size: 'sm', shape: 'pill' })
  return (
    <span className={classes}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`${dotClass} item-indicator--page-dot${i === clamped ? ' item-indicator--page-dot-active' : ''}`}
        />
      ))}
    </span>
  )
}
