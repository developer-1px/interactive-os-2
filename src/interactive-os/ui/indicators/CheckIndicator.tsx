// ② 2026-03-28-ui-indicators-prd.md
interface CheckIndicatorProps {
  checked?: boolean
  className?: string
}

const checkIcon = (
  <svg className="item-indicator--checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export function CheckIndicator({ checked, className }: CheckIndicatorProps) {
  const classes = ['item-indicator--checkbox', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {checked && checkIcon}
    </span>
  )
}
