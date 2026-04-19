// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

export function RadioIndicator({ className }: { className?: string }) {
  const classes = [
    ax({ flex: 'none', layout: 'center' }),
    'item-indicator--radio',
    className,
  ].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="item-indicator--radio-dot" />
    </span>
  )
}
