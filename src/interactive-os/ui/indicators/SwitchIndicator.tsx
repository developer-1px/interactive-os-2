// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

export function SwitchIndicator({ className }: { className?: string }) {
  const classes = [
    ax({ flex: 'none', placement: 'relative', border: 'strong', shape: 'pill' }),
    'item-indicator--switch',
    className,
  ].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="absolute item-indicator--switch-thumb" />
    </span>
  )
}
