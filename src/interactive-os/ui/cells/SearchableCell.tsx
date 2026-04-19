import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { Aria } from '../../primitives/aria'

interface SearchableCellProps {
  children: ReactNode
  empty?: boolean
  muted?: boolean
}

export function SearchableCell({ children, empty, muted: _muted }: SearchableCellProps) {
  return (
    <Aria.SearchHighlight>
      <span className={ax({ role: 'item', surface: 'input' })}>
        {empty ? '' : children}
      </span>
    </Aria.SearchHighlight>
  )
}
