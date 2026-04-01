import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { alertdialog } from '../pattern/roles/alertdialog'
import { ax } from '../../poc/ax'
import '../../poc/ax.css'

type AlertDialogProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const isDanger = label === 'Delete' || label === 'Confirm'
  return (
    <div
      {...props}
      className={ax({
        surface: isDanger ? 'action' : 'ghost',
        controlSize: 'md',
        tone: isDanger ? 'danger' : 'neutral',
        text: state.focused ? 'primary' : 'secondary',
      })}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function AlertDialog({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
}: AlertDialogProps) {
  return (
    <Aria
      pattern={alertdialog}
      data={data}
      plugins={plugins}
      onChange={onChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
