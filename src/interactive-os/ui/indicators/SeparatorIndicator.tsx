// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'

interface SeparatorIndicatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function SeparatorIndicator({ orientation = 'horizontal', className }: SeparatorIndicatorProps) {
  const isHorizontal = orientation === 'horizontal'
  const classes = [`${ax({ flex: 'none' })}${isHorizontal ? ' w-full' : ''}`, 'item-indicator--separator', className].filter(Boolean).join(' ')
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
    />
  )
}
