// ② 2026-04-08-useCommandBind-prd.md
import { ChevronRight } from 'lucide-react'
import { useCommandBind } from '../../primitives/useCommandBind'

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
  const bindProps = useCommandBind('click', 'expand:toggle')

  return (
    <span className={classes} data-expanded={expanded ? '' : undefined} {...bindProps}>
      {hasChildren && <ChevronRight size="1em" />}
    </span>
  )
}
