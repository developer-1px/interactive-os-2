import type { HTMLAttributes, ReactNode } from 'react'
import { ax, type Axes } from '@styles/ax'

interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** ax() 축 오버라이드. 기본: layout:bar, flex:none, textStyle:overline, text:muted */
  axes?: Axes
}

/** 패널/사이드바 상단 바. height:36px + border-bottom + bar layout. */
export function PanelHeader({ children, className, axes, ...rest }: PanelHeaderProps) {
  const base: Axes = { layout: 'bar', flex: 'none', textStyle: 'overline', text: 'muted', padding: 'md', border: 'bottom' }
  return (
    <div
      className={`${ax({ ...base, ...axes })}${className ? ` ${className}` : ''}`}
      style={{ height: 'var(--toolbar-height)' }}
      {...rest}
    >
      {children}
    </div>
  )
}
