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
      <span className={empty ? ax({ surface: 'sunken' }) : muted ? ax({  }) : undefined}>
        {empty ? '' : children}
      </span>
    </Aria.SearchHighlight>
  )
}
