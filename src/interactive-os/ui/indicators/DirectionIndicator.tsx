// ② 2026-03-28-ui-indicators-prd.md
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DirectionIndicatorProps {
  direction: 'prev' | 'next'
  /** Double chevron for larger jumps (e.g. year navigation) */
  double?: boolean
  /** Vertical orientation renders up/down instead of left/right */
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const iconMap = {
  horizontal: { prev: ChevronLeft, next: ChevronRight },
  'horizontal-double': { prev: ChevronsLeft, next: ChevronsRight },
  vertical: { prev: ChevronUp, next: ChevronDown },
} as const

export function DirectionIndicator({ direction, double, orientation = 'horizontal', className }: DirectionIndicatorProps) {
  const classes = ['inline-flex items-center justify-center', 'item-indicator--direction', className].filter(Boolean).join(' ')
  const key = orientation === 'vertical' ? 'vertical' : (double ? 'horizontal-double' : 'horizontal')
  const Icon = iconMap[key][direction]
  return (
    <span className={classes}>
      <Icon size="1em" />
    </span>
  )
}
