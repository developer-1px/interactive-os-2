var e=`// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortIndicatorProps {
  direction?: 'ascending' | 'descending'
  className?: string
}

export function SortIndicator({ direction, className }: SortIndicatorProps) {
  const classes = [ax({ flex: 'none', layout: 'center' }), 'item-indicator--sort', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {direction === 'ascending' && <ArrowUp size="1em" />}
      {direction === 'descending' && <ArrowDown size="1em" />}
      {direction === undefined && <ArrowUpDown size="1em" />}
    </span>
  )
}
`;export{e as default};