/** @catalog 키보드 단축키 표시 — keycap */
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

interface KbdProps {
  children: ReactNode
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd
      className={ax({
        role: 'badge',
        surface: 'overlay',
        textStyle: 'code',
        content: 'text',
      })}
    >
      {children}
    </kbd>
  )
}
