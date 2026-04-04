import { X } from 'lucide-react'

interface CloseIndicatorProps {
  className?: string
}

export function CloseIndicator({ className }: CloseIndicatorProps) {
  const classes = ['inline-flex items-center justify-center', 'item-indicator--close', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <X size="1em" />
    </span>
  )
}
