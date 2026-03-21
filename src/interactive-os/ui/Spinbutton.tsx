import React from 'react'
import './spinbutton.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { spinbutton } from '../behaviors/spinbutton'
import { core } from '../plugins/core'
import { history } from '../plugins/history'

interface SpinbuttonProps {
  data: NormalizedData
  min: number
  max: number
  step: number
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  label?: string
}

export function Spinbutton({
  data,
  min,
  max,
  step,
  plugins = [core(), history()],
  onChange,
  label,
}: SpinbuttonProps) {
  const behavior = React.useMemo(() => spinbutton({ min, max, step }), [min, max, step])

  const renderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const current = state.valueCurrent ?? min
    const itemLabel = label ?? (item.data as Record<string, unknown>)?.label as string ?? item.id as string

    return (
      <div className="spinbutton-item" data-focused={state.focused || undefined}>
        {itemLabel && <span className="spinbutton-label">{itemLabel}</span>}
        <div className="spinbutton-inner">
          <span className="spinbutton-value">{current}</span>
        </div>
      </div>
    )
  }

  return (
    <Aria behavior={behavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
