import { CornerDownRight } from 'lucide-react'

interface SymlinkIndicatorProps {
  target?: string
  className?: string
}

export function SymlinkIndicator({ target, className }: SymlinkIndicatorProps) {
  return (
    <CornerDownRight
      size="1em"
      className={className}
      aria-label={target ? `symlink → ${target}` : 'symlink'}
    />
  )
}
