var e=`// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import { ax, type Axes } from '@styles/ax'
import { PanelHeader } from '../PanelHeader'

interface PanelProps {
  header?: string
  surface?: Axes['surface']
  children: ReactNode
  className?: string
  /** body에 layout:'scroll' 적용. 기본 true */
  scroll?: boolean
}

export function Panel({ header, surface, children, className, scroll = true }: PanelProps) {
  return (
    <div className={\`\${ax({ layout: 'fill', surface })}\${className ? \` \${className}\` : ''}\`}>
      {header && <PanelHeader>{header}</PanelHeader>}
      <div className={ax({ layout: scroll ? 'scroll' : 'fill' })}>
        {children}
      </div>
    </div>
  )
}
`;export{e as default};