// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { PanelHeader } from '../PanelHeader'

type PanelSurface = 'sunken' | 'base' | 'raised' | 'overlay' | 'ghost'

interface PanelProps {
  header?: string
  surface?: PanelSurface
  children: ReactNode
  className?: string
  /** body에 layout:'scroll' 적용. 기본 true */
  scroll?: boolean
}

export function Panel({ header, surface, children, className, scroll = true }: PanelProps) {
  return (
    <div className={`${ax({ role: 'control-group', layout: 'fill', surface })}${className ? ` ${className}` : ''}`}>
      {header && <PanelHeader>{header}</PanelHeader>}
      <div className={ax({ layout: scroll ? 'scroll' : 'fill' })}>
        {children}
      </div>
    </div>
  )
}
