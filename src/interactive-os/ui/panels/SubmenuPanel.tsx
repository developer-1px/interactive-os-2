// ② 2026-04-06-menubar-refactor-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import './SubmenuPanel.css'

interface SubmenuPanelProps {
  label: string
  expanded?: boolean
  placement: 'root' | 'nested'
  anchorName: string
  children: ReactNode
}

export function SubmenuPanel({ label, expanded, placement, anchorName, children }: SubmenuPanelProps) {
  if (!expanded) return null

  return (
    <div
      role="menu"
      aria-label={label}
      className={`submenu-panel submenu-panel-${placement} ${ax({ surface: 'overlay', padding: 'xs', shape: 'sm', gap: 'xs' })}`}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
