// ② 2026-03-28-ui-indicators-prd.md
interface SeparatorIndicatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function SeparatorIndicator({ orientation = 'horizontal', className }: SeparatorIndicatorProps) {
  const classes = ['item-indicator--separator', className].filter(Boolean).join(' ')
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
    />
  )
}
