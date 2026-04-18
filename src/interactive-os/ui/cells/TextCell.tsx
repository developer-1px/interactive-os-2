// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

interface TextCellProps {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function TextCell({ children, align, className }: TextCellProps) {
  const alignClass = align === 'center' ? ' text-center' : align === 'end' ? ' text-right' : ''
  return (
    <span className={ax({ clamp: '1' }) + alignClass + (className ? ` ${className}` : '')}>
      {children}
    </span>
  )
}
