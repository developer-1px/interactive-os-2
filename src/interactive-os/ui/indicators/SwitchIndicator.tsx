// ② 2026-03-28-ui-indicators-prd.md
interface SwitchIndicatorProps {
  className?: string
}

export function SwitchIndicator({ className }: SwitchIndicatorProps) {
  const classes = ['shrink-0 relative', 'item-indicator--switch', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="absolute item-indicator--switch-thumb" />
    </span>
  )
}
