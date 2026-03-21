import React, { useCallback, useState, useRef } from 'react'
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
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const dispatch = useCallback((cmd: ReturnType<typeof valueCommands.setValue>) => {
    getAriaActions(stableId)?.dispatch(cmd)
  }, [stableId])

  const handleIncrement = useCallback(() => {
    dispatch(valueCommands.increment(step, range))
  }, [dispatch, step, range])

  const handleDecrement = useCallback(() => {
    dispatch(valueCommands.decrement(step, range))
  }, [dispatch, step, range])

  const commitEdit = useCallback((raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      dispatch(valueCommands.setValue(min, range))
      setInvalid(false)
      setEditing(false)
      return
    }
    const parsed = Number(trimmed)
    if (isNaN(parsed)) {
      setInvalid(true)
      return
    }
    // setValue already clamps
    dispatch(valueCommands.setValue(parsed, range))
    setInvalid(false)
    setEditing(false)
  }, [dispatch, min, range])

  const renderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => {
    const current = state.valueCurrent ?? min
    const itemLabel = label ?? (item.data as Record<string, unknown>)?.label as string ?? item.id as string
    const atMin = current <= min
    const atMax = current >= max

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleIncrement()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleDecrement()
      } else if (e.key === 'Home') {
        e.preventDefault()
        dispatch(valueCommands.setValue(min, range))
      } else if (e.key === 'End') {
        e.preventDefault()
        dispatch(valueCommands.setValue(max, range))
      } else if (e.key === 'PageUp') {
        e.preventDefault()
        dispatch(valueCommands.increment(step * 10, range))
      } else if (e.key === 'PageDown') {
        e.preventDefault()
        dispatch(valueCommands.decrement(step * 10, range))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit(e.currentTarget.value)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setEditing(false)
        setInvalid(false)
      }
    }

    const startEditing = () => {
      setEditValue(String(current))
      setEditing(true)
      setInvalid(false)
      requestAnimationFrame(() => inputRef.current?.select())
    }

    return (
      <div className="spinbutton-item" data-focused={state.focused || undefined}>
        {itemLabel && <span className="spinbutton-label">{itemLabel}</span>}
        <div className="spinbutton-group" data-invalid={invalid || undefined}>
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
          {editing ? (
            <input
              ref={inputRef}
              className="spinbutton-input"
              type="text"
              inputMode="numeric"
              value={editValue}
              aria-invalid={invalid || undefined}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={(e) => commitEdit(e.target.value)}
            />
          ) : (
            <div
              className="spinbutton-value"
              onClick={startEditing}
              onDoubleClick={startEditing}
            >
              {current}
            </div>
          )}
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
