import React, { useCallback } from 'react'
import './spinbutton.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { spinbutton } from '../behaviors/spinbutton'
import { core, valueCommands } from '../plugins/core'
import { history } from '../plugins/history'
import { getAriaActions } from '../components/ariaRegistry'

let spinIdCounter = 0

interface SpinbuttonProps {
  id?: string
  data: NormalizedData
  min: number
  max: number
  step: number
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  label?: string
}

export function Spinbutton({
  id,
  data,
  min,
  max,
  step,
  plugins = [core(), history()],
  onChange,
  label,
}: SpinbuttonProps) {
  const stableId = React.useMemo(() => id ?? `spinbutton-${++spinIdCounter}`, [id])
  const behavior = React.useMemo(() => spinbutton({ min, max, step }), [min, max, step])
  const range = React.useMemo(() => ({ min, max, step }), [min, max, step])

  const handleIncrement = useCallback(() => {
    getAriaActions(stableId)?.dispatch(valueCommands.increment(step, range))
  }, [stableId, step, range])

  const handleDecrement = useCallback(() => {
    getAriaActions(stableId)?.dispatch(valueCommands.decrement(step, range))
  }, [stableId, step, range])

  const renderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const current = state.valueCurrent ?? min
    const itemLabel = label ?? (item.data as Record<string, unknown>)?.label as string ?? item.id as string
    const atMin = current <= min
    const atMax = current >= max

    return (
      <div className="spinbutton-item" data-focused={state.focused || undefined}>
        {itemLabel && <span className="spinbutton-label">{itemLabel}</span>}
        <div className="spinbutton-group">
          <button
            type="button"
            className="spinbutton-btn spinbutton-btn--dec"
            tabIndex={-1}
            aria-label={`Decrease ${itemLabel}`}
            aria-disabled={atMin || undefined}
            onClick={handleDecrement}
          >
            −
          </button>
          <div className="spinbutton-value">{current}</div>
          <button
            type="button"
            className="spinbutton-btn spinbutton-btn--inc"
            tabIndex={-1}
            aria-label={`Increase ${itemLabel}`}
            aria-disabled={atMax || undefined}
            onClick={handleIncrement}
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <Aria id={stableId} behavior={behavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
