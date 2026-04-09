import { ax } from '@styles/ax'
import { Plus } from 'lucide-react'

interface AddIndicatorProps {
  className?: string
}

export function AddIndicator({ className }: AddIndicatorProps) {
  const classes = [`inline-flex ${ax({ layout: 'center' })}`, 'item-indicator--add', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <Plus size="1em" />
    </span>
  )
}
