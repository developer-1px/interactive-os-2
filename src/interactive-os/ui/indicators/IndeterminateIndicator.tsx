// ② 2026-03-28-ui-indicators-prd.md
interface IndeterminateIndicatorProps {
  className?: string
}

const dashIcon = (
  <svg className="item-indicator--checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
)

export function IndeterminateIndicator({ className }: IndeterminateIndicatorProps) {
  const classes = ['shrink-0 flex-row items-center justify-center', 'item-indicator--checkbox', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {dashIcon}
    </span>
  )
}
