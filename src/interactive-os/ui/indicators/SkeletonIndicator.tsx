// ② 2026-03-28-ui-indicators-prd.md
interface SkeletonIndicatorProps {
  width?: string
  height?: string
  className?: string
}

export function SkeletonIndicator({ width, height, className }: SkeletonIndicatorProps) {
  const classes = ['item-indicator--skeleton', className].filter(Boolean).join(' ')
  return <div className={classes} style={{ width, height }} />
}
