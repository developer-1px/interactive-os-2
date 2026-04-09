import { ax } from '@styles/ax'
import { Plus, Minus } from 'lucide-react'

interface IncrementIndicatorProps {
  direction: 'increment' | 'decrement'
  className?: string
}

export function IncrementIndicator({ direction, className }: IncrementIndicatorProps) {
  const classes = [`inline-flex ${ax({ layout: 'center' })}`, 'item-indicator--increment', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {direction === 'increment' ? <Plus size="1em" /> : <Minus size="1em" />}
    </span>
  )
}
