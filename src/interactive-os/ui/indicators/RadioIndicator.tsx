// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface RadioIndicatorProps {
  checked?: boolean
  className?: string
}

export function RadioIndicator({ checked, className }: RadioIndicatorProps) {
  const classes = [ax({ flex: 'none', layout: 'center' }), 'item-indicator--radio', className].filter(Boolean).join(' ')
  return (
    <span className={classes} data-checked={checked || undefined}>
      <span className="item-indicator--radio-dot" />
    </span>
  )
}
