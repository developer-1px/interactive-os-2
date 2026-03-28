// ② 2026-03-28-ui-indicators-prd.md
import { GripVertical, GripHorizontal } from 'lucide-react'

interface GripIndicatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function GripIndicator({ orientation = 'vertical', className }: GripIndicatorProps) {
  const classes = ['item-indicator--grip', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {orientation === 'vertical' ? <GripVertical size="1em" /> : <GripHorizontal size="1em" />}
    </span>
  )
}
