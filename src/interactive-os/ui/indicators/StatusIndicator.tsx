// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface StatusIndicatorProps {
  tone?: 'success' | 'error' | 'warning' | 'info'
  variant?: 'filled' | 'ring'
  className?: string
}

export function StatusIndicator({ tone = 'info', variant = 'filled', className }: StatusIndicatorProps) {
  const classes = [
    `inline-block ${ax({ flex: 'none', square: 'sm', shape: 'pill' })}`,
    'item-indicator--status',
    `item-indicator--status-${tone}`,
    variant === 'ring' ? 'item-indicator--status-ring' : undefined,
    className,
  ].filter(Boolean).join(' ')
  return <span className={classes} />
}
