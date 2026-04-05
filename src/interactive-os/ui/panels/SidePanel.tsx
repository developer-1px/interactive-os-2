// ② 2026-04-05-ui-items-prd.md
import { useState, type ReactNode } from 'react'
import { ax, type Axes } from '@styles/ax'
import { PanelHeader } from '../PanelHeader'
import { CloseIndicator } from '../indicators'

interface SidePanelProps {
  header?: string
  surface?: Axes['surface']
  children: ReactNode
  className?: string
  scroll?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export function SidePanel({
  header,
  surface,
  children,
  className,
  scroll = true,
  collapsible = false,
  defaultCollapsed = false,
}: SidePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed && collapsible)

  if (collapsed) {
    return (
      <div
        className={`${ax({ layout: 'stack', surface, flex: 'none', padding: 'sm' })}${className ? ` ${className}` : ''}`}
        role="region"
      >
        {header && (
          <button
            className={ax({ textStyle: 'overline', text: 'muted' })}
            onClick={() => setCollapsed(false)}
            aria-expanded={false}
          >
            {header}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`${ax({ layout: 'fill', surface })}${className ? ` ${className}` : ''}`} role="region">
      {header && (
        <PanelHeader>
          {header}
          {collapsible && (
            <button
              className={ax({ text: 'muted' })}
              onClick={() => setCollapsed(true)}
              aria-expanded={true}
            >
              <CloseIndicator />
            </button>
          )}
        </PanelHeader>
      )}
      <div className={ax({ layout: scroll ? 'scroll' : 'fill' })}>
        {children}
      </div>
    </div>
  )
}
