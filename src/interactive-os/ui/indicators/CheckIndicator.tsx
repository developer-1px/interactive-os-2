// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

const checkIcon = (
  <svg className="item-indicator--checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export function CheckIndicator({ className }: { className?: string }) {
  const classes = [
    ax({ flex: 'none', layout: 'center', border: 'strong', shape: 'sm' }),
    'bg-transparent',
    'item-indicator--checkbox',
    className,
  ].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {checkIcon}
    </span>
  )
}
