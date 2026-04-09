// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'
import { Loader2 } from 'lucide-react'

interface SpinnerIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SpinnerIndicator({ size = 'md', className }: SpinnerIndicatorProps) {
  const sizeClass = `item-indicator--spinner-${size}`
  const classes = [`inline-flex ${ax({ layout: 'center' })}`, 'item-indicator--spinner', sizeClass, className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <Loader2 size="1em" />
    </span>
  )
}
