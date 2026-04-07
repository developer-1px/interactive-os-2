/** @catalog 모달 다이얼로그 */
import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { dialog } from '../pattern/roles/dialog'
import { ax } from '@styles/ax'
import '@styles/ax.css'

interface DialogProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div
      {...props}
      className={ax({ interactive: 'item', shape: 'md', controlSize: 'md', padding: 'sm', content: 'text', text: state.focused ? 'primary' : 'secondary' })}
      data-focused={state.focused || undefined}
    >
      {label}
    </div>
  )
}

export function Dialog({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: DialogProps) {
  return (
    <Aria pattern={dialog} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
