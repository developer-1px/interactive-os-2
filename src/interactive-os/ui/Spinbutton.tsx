import React, { useCallback, useState, useRef } from 'react'
import styles from './Spinbutton.module.css'
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

    const dispatchAndSync = (cmd: ReturnType<typeof valueCommands.setValue>) => {
      dispatch(cmd)
      // Read back the committed value from store so editValue stays in sync
      requestAnimationFrame(() => {
        const store = getAriaActions(stableId)?.getStore()
        const v = (store?.entities['__value__'] as Record<string, unknown>)?.value as number | undefined
        if (v !== undefined) setEditValue(String(v))
      })
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        dispatchAndSync(valueCommands.increment(step, range))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        dispatchAndSync(valueCommands.decrement(step, range))
      } else if (e.key === 'Home') {
        e.preventDefault()
        dispatchAndSync(valueCommands.setValue(min, range))
      } else if (e.key === 'End') {
        e.preventDefault()
        dispatchAndSync(valueCommands.setValue(max, range))
      } else if (e.key === 'PageUp') {
        e.preventDefault()
        dispatchAndSync(valueCommands.increment(step * 10, range))
      } else if (e.key === 'PageDown') {
        e.preventDefault()
        dispatchAndSync(valueCommands.decrement(step * 10, range))
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
      <div className={styles.spinbuttonItem} data-focused={state.focused || undefined}>
        {itemLabel && <span className={styles.spinbuttonLabel}>{itemLabel}</span>}
        <div className={styles.spinbuttonGroup} data-invalid={invalid || undefined}>
          <button
            type="button"
            className={`${styles.spinbuttonBtn} ${styles.spinbuttonBtnDec}`}
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
              className={styles.spinbuttonInput}
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
              className={styles.spinbuttonValue}
              onClick={startEditing}
              onDoubleClick={startEditing}
            >
              {current}
            </div>
          )}
          <button
            type="button"
            className={`${styles.spinbuttonBtn} ${styles.spinbuttonBtnInc}`}
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
