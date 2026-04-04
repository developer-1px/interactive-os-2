// ② 2026-03-28-ui-indicators-prd.md
import { ChevronRight } from 'lucide-react'

interface ExpandIndicatorProps {
  expanded?: boolean
  hasChildren?: boolean
  variant?: 'expand' | 'tree'
  className?: string
}

export function ExpandIndicator({
  expanded,
  hasChildren = true,
  variant = 'expand',
  className,
}: ExpandIndicatorProps) {
  const variantClass = variant === 'tree' ? 'item-chevron--tree' : 'item-chevron--expand'
  const classes = ['inline-flex items-center justify-center shrink-0', 'item-chevron', variantClass, className].filter(Boolean).join(' ')

  return (
    <span className={classes} data-expanded={expanded ? '' : undefined}>
      {hasChildren && <ChevronRight size="1em" />}
    </span>
  )
}
