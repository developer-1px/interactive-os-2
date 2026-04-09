// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface SwitchIndicatorProps {
  checked?: boolean
  className?: string
}

export function SwitchIndicator({ checked, className }: SwitchIndicatorProps) {
  const classes = [ax({ flex: 'none', placement: 'relative' }), 'item-indicator--switch', className].filter(Boolean).join(' ')
  return (
    <span className={classes} data-checked={checked || undefined}>
      <span className="absolute item-indicator--switch-thumb" />
    </span>
  )
}
