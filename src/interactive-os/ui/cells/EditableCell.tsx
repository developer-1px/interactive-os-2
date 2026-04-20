import React from 'react'
import type { ReactNode } from 'react'
import { Aria } from '../../primitives/aria'
import { AriaItemContext } from '../../primitives/AriaEditable'

interface EditableCellProps {
  field: string
  children: ReactNode
  empty?: boolean
  allowEmpty?: boolean
  enterContinue?: boolean
  tabContinue?: boolean
}

/** 표시 모드는 plain text — chrome 없음. 편집 모드(renaming)일 때만 sf-input
 *  border/bg가 나타난다. 높이는 바깥 [role="cell"]의 --cs-h를 상속하도록 CSS에서 주입
 *  (ax.css의 .ly-table [role="row"] > [role="cell"] .sf-input 규칙). */
export function EditableCell({ field, children, empty, allowEmpty, enterContinue, tabContinue }: EditableCellProps) {
  const nodeCtx = React.useContext(AriaItemContext)
  const renaming = nodeCtx?.renaming ?? false
  return (
    <Aria.Editable
      field={field}
      allowEmpty={allowEmpty}
      enterContinue={enterContinue}
      tabContinue={tabContinue}
      className={renaming ? 'sf-input' : undefined}
    >
      <span>{empty ? '—' : children}</span>
    </Aria.Editable>
  )
}
