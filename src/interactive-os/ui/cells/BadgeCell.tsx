// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import type { AxTone } from '@styles/ax'
import { ax } from '@styles/ax'

interface BadgeCellProps {
  tone: AxTone
  children: ReactNode
  className?: string
}

export function BadgeCell({ tone, children, className }: BadgeCellProps) {
  return (
    <span className={ax({ role: 'item', surface: 'display', tone, textStyle: 'caption', content: 'text' }) + (className ? ` ${className}` : '')}>
      {children}
    </span>
  )
}
