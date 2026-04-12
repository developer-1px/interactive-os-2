// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface SkeletonIndicatorProps {
  width?: string
  height?: string
  className?: string
}

export function SkeletonIndicator({ width, height, className }: SkeletonIndicatorProps) {
  const classes = [ax({ shape: 'sm' }), 'item-indicator--skeleton', className].filter(Boolean).join(' ')
  return <div className={classes} style={{ width, height }} />
}
