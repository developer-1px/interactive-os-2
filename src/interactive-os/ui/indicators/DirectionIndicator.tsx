// ② 2026-03-28-ui-indicators-prd.md
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DirectionIndicatorProps {
  direction: 'prev' | 'next'
  className?: string
}

export function DirectionIndicator({ direction, className }: DirectionIndicatorProps) {
  const classes = ['item-indicator--direction', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {direction === 'prev' ? <ChevronLeft size="1em" /> : <ChevronRight size="1em" />}
    </span>
  )
}
