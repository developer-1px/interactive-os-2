import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { Aria } from '../../primitives/aria'

interface SearchableCellProps {
  children: ReactNode
  empty?: boolean
  muted?: boolean
}

export function SearchableCell({ children, empty, muted }: SearchableCellProps) {
  return (
    <Aria.SearchHighlight>
      <span className={empty ? ax({ text: 'muted' }) : muted ? ax({ text: 'secondary' }) : undefined}>
        {empty ? '—' : children}
      </span>
    </Aria.SearchHighlight>
  )
}
