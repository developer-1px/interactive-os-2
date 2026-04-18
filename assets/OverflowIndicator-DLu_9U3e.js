var e=`// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface OverflowIndicatorProps {
  count: number
  className?: string
}

export function OverflowIndicator({ count, className }: OverflowIndicatorProps) {
  if (count <= 0) return null
  const classes = [\`whitespace-nowrap \${ax({ flex: 'none' })}\`, 'item-indicator--overflow', className].filter(Boolean).join(' ')
  return <span className={classes}>+{count}</span>
}
`;export{e as default};