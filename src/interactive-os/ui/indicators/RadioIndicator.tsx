// ② 2026-03-28-ui-indicators-prd.md
interface RadioIndicatorProps {
  className?: string
}

export function RadioIndicator({ className }: RadioIndicatorProps) {
  const classes = ['shrink-0 flex-row items-center justify-center', 'item-indicator--radio', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <span className="item-indicator--radio-dot" />
    </span>
  )
}
