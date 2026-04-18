var e=`/** @catalog 패널 상단 헤더 바 */
import type { HTMLAttributes, ReactNode } from 'react'
import { ax, type Axes } from '@styles/ax'

interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** ax() 축 오버라이드. 기본: layout:bar, flex:none, textStyle:overline, text:muted */
  axes?: Axes
}

/** 패널/사이드바 상단 바. role:item + border-bottom. */
export function PanelHeader({ children, className, axes, ...rest }: PanelHeaderProps) {
  const base = { role: 'item' as const, content: 'text' as const, layout: 'bar' as const, flex: 'none' as const, textStyle: 'overline' as const, text: 'muted' as const, border: 'bottom' as const, width: 'full' as const }
  return (
    <div
      className={\`\${ax({ ...base, ...axes } as Axes)}\${className ? \` \${className}\` : ''}\`}
      {...rest}
    >
      {children}
    </div>
  )
}
`;export{e as default};