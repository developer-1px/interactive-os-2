/** @catalog 그룹 구분 헤더 */
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { ExpandIndicator } from './indicators/ExpandIndicator'

interface GroupHeaderProps {
  icon?: ReactNode
  label: string
  count?: number
  expanded?: boolean
  onToggle?: () => void
}

export function GroupHeader({ icon, label, count, expanded, onToggle }: GroupHeaderProps) {
  return (
    <div
      className={ax({ recipe: 'item-sm', interactive: 'item', layout: 'bar', padding: 'xs', gap: 'sm', shape: '2xs', width: 'full' })}
      onClick={onToggle}
    >
      {expanded !== undefined && (
        <ExpandIndicator expanded={expanded} />
      )}
      {icon}
      <span className={ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}>{label}</span>
      {count !== undefined && (
        <span className={`ml-auto ${ax({ flex: 'none', textStyle: 'caption', text: 'muted' })}`}>{count}</span>
      )}
    </div>
  )
}
