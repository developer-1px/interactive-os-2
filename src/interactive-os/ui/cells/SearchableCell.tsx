import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { Aria } from '../../primitives/aria'

interface SearchableCellProps {
  children: ReactNode
  empty?: boolean
  muted?: boolean
}

export function SearchableCell({ children, empty, muted }: SearchableCellProps) {
  // Render tone via ax() — empty: muted em-dash, key column: secondary tone.
  const innerClass = empty || muted ? ax({ role: 'item', tone: 'neutral-dim' }) : undefined
  return (
    <Aria.SearchHighlight>
      <span className={ax({ role: 'cell', surface: 'input' })}>
        <span
          className={innerClass}
          data-cell-empty={empty ? '' : undefined}
          data-cell-muted={muted ? '' : undefined}
        >
          {empty ? '—' : children}
        </span>
      </span>
    </Aria.SearchHighlight>
  )
}
