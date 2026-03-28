// ② 2026-03-28-ui-indicators-prd.md
interface StatusIndicatorProps {
  tone?: 'success' | 'error' | 'warning' | 'info'
  className?: string
}

export function StatusIndicator({ tone = 'info', className }: StatusIndicatorProps) {
  const classes = ['item-indicator--status', `item-indicator--status-${tone}`, className].filter(Boolean).join(' ')
  return <span className={classes} />
}
