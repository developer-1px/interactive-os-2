// ② 2026-03-28-ui-indicators-prd.md
interface RadioIndicatorProps {
  checked?: boolean
  className?: string
}

export function RadioIndicator({ checked, className }: RadioIndicatorProps) {
  const classes = ['shrink-0 flex-row items-center justify-center', 'item-indicator--radio', className].filter(Boolean).join(' ')
  return (
    <span className={classes} data-checked={checked || undefined}>
      <span className="item-indicator--radio-dot" />
    </span>
  )
}
