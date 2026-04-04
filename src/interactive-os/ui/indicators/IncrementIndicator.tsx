import { Plus, Minus } from 'lucide-react'

interface IncrementIndicatorProps {
  direction: 'increment' | 'decrement'
  className?: string
}

export function IncrementIndicator({ direction, className }: IncrementIndicatorProps) {
  const classes = ['inline-flex items-center justify-center', 'item-indicator--increment', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {direction === 'increment' ? <Plus size="1em" /> : <Minus size="1em" />}
    </span>
  )
}
