// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { PanelHeader } from '../PanelHeader'

type PanelSurface = 'sunken' | 'base' | 'raised' | 'overlay' | 'ghost'

interface PanelProps {
  /** string → 자동 PanelHeader 래핑. ReactNode → 슬롯 그대로 (복잡한 헤더 composition).
   *  pages에서 scroll 오너십 집중을 위해 ReactNode 슬롯 지원 — Panel이 header 고정 + body 스크롤을 소유. */
  header?: string | ReactNode
  surface?: PanelSurface
  children: ReactNode
  className?: string
  /** body에 layout:'scroll' 적용. 기본 true */
  scroll?: boolean
}

export function Panel({ header, surface, children, className, scroll = true }: PanelProps) {
  return (
    <div className={`${ax({ role: 'control-group', layout: 'fill', surface })}${className ? ` ${className}` : ''}`}>
      {header !== undefined && (typeof header === 'string' ? <PanelHeader>{header}</PanelHeader> : header)}
      <div className={ax({ layout: scroll ? 'scroll' : 'fill' })}>
        {children}
      </div>
    </div>
  )
}
