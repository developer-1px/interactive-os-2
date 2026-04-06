// ② 2026-04-06-menubar-refactor-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

interface SubmenuPanelProps {
  label: string
  expanded?: boolean
  placement: 'root' | 'nested'
  anchorName: string
  children: ReactNode
}

const placementMap = {
  root: 'anchor-below',
  nested: 'anchor-end',
} as const

export function SubmenuPanel({ label, expanded, placement, anchorName, children }: SubmenuPanelProps) {
  return (
    <div
      role="menu"
      aria-label={label}
      hidden={!expanded || undefined}
      className={ax({ placement: placementMap[placement], surface: 'overlay', padding: 'xs', shape: 'sm', gap: 'xs' })}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
