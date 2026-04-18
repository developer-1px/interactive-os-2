var e=`import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { Aria } from '../../primitives/aria'

interface EditableCellProps {
  field: string
  children: ReactNode
  empty?: boolean
  allowEmpty?: boolean
  enterContinue?: boolean
  tabContinue?: boolean
}

export function EditableCell({ field, children, empty, allowEmpty, enterContinue, tabContinue }: EditableCellProps) {
  return (
    <Aria.Editable field={field} allowEmpty={allowEmpty} enterContinue={enterContinue} tabContinue={tabContinue}>
      <span className={empty ? ax({ text: 'muted' }) : undefined}>
        {empty ? '—' : children}
      </span>
    </Aria.Editable>
  )
}
`;export{e as default};