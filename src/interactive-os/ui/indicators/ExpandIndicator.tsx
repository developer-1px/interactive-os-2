// ② 2026-03-28-ui-indicators-prd.md
import { ChevronDown, ChevronRight } from 'lucide-react'

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
  const classes = ['item-chevron', variantClass, className].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {hasChildren && (expanded ? <ChevronDown size="1em" /> : <ChevronRight size="1em" />)}
    </span>
  )
}
