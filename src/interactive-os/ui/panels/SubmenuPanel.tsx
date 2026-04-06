// ② 2026-04-06-menubar-refactor-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import './SubmenuPanel.css'

interface SubmenuPanelProps {
  /** aria-label for the menu */
  label: string
  /** Whether this submenu is expanded/visible */
  expanded?: boolean
  /** 'root' = below trigger (block-end), 'nested' = right of trigger (inline-end) */
  placement: 'root' | 'nested'
  /** CSS anchor name to position against */
  anchorName: string
  children: ReactNode
}

export function SubmenuPanel({ label, expanded, placement, anchorName, children }: SubmenuPanelProps) {
  return (
    <ul
      role="menu"
      aria-label={label}
      className={`submenu-panel submenu-panel-${placement} ${ax({ surface: 'overlay', padding: 'xs', shape: 'sm' })}`}
      data-hidden={!expanded || undefined}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
    >
      {children}
    </ul>
  )
}
