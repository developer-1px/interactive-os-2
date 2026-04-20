import type { ReactNode } from 'react'
import { Aria } from '../../primitives/aria'

interface SearchableCellProps {
  children: ReactNode
  empty?: boolean
  muted?: boolean
}

export function SearchableCell({ children, empty, muted }: SearchableCellProps) {
  // 읽기 전용 셀은 plain text — chrome은 편집 전환(EditableCell) 시에만 노출.
  // tone만 주입: role 브랜치 없이 Public tone 클래스 직접 사용 (Pit of Failure 아님, utility path).
  const toneClass = empty || muted ? 'tn-neutral-dim' : undefined
  return (
    <Aria.SearchHighlight>
      <span
        className={toneClass}
        data-cell-empty={empty ? '' : undefined}
        data-cell-muted={muted ? '' : undefined}
      >
        {empty ? '—' : children}
      </span>
    </Aria.SearchHighlight>
  )
}
