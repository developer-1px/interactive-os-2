/** @catalog 모달 다이얼로그 */
import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { dialog } from '../pattern/roles/dialog'
import { DialogItem } from './items'

interface DialogProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

export function Dialog({
  data,
  plugins = [],
  onChange,
  renderItem = DialogItem,
}: DialogProps) {
  return (
    <Aria pattern={dialog} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
