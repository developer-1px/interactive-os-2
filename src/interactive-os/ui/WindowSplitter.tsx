/** @catalog 윈도우 분할 스플리터 */
import React, { useMemo } from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { windowSplitter } from '../pattern/roles/windowSplitter'

interface WindowSplitterProps extends AriaComponentProps {
  min?: number
  max?: number
  step?: number
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, _item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const current = (state.valueCurrent as number) ?? 50
  return (
    <div {...props} data-focused={state.focused || undefined}>
      {current}%
    </div>
  )
}

export function WindowSplitter({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  'aria-label': ariaLabel,
  min = 0,
  max = 100,
  step = 1,
}: WindowSplitterProps) {
  const pattern = useMemo(() => windowSplitter({ min, max, step }), [min, max, step])

  return (
    <Aria pattern={pattern} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
