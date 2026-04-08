/** @catalog 숫자 증감 스핀버튼 */
// ② 2026-04-03-command-unification-prd.md
import React, { useCallback, useRef } from 'react'
import { ax } from '@styles/ax'
import './Spinbutton.css'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { spinbutton } from '../pattern/roles/spinbutton'
import { valueCommands } from '../axis/value'
import { editCommands } from '../axis/edit'
import { history } from '../plugins/history'
import { getAriaActions } from '../primitives/ariaRegistry'
import { IncrementIndicator } from './indicators'

interface SpinbuttonProps extends AriaComponentProps {
  id?: string
  min: number
  max: number
  step: number
  label?: string
}

export function Spinbutton({
  id,
  data,
  min,
  max,
  step,
  plugins = [history()],
  onChange,
  label,
}: SpinbuttonProps) {
  const reactId = React.useId()
  const stableId = id ?? reactId
  const pattern = React.useMemo(() => spinbutton({ min, max, step }), [min, max, step])
  const range = React.useMemo(() => ({ min, max, step }), [min, max, step])
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
      dispatch(editCommands.commitEdit())
      return
    }
    const parsed = Number(trimmed)
    if (isNaN(parsed)) {
      dispatch(editCommands.setEditInvalid(true))
      return
    }
    dispatch(valueCommands.setValue(parsed, range))
    dispatch(editCommands.commitEdit())
  }, [dispatch, min, range])

  const renderItem = (_props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
    const current = state.valueCurrent ?? min
    const itemLabel = label ?? getNodeLabel(item)
    const atMin = current <= min
    const atMax = current >= max
    const editing = (state as Record<string, unknown>).editing as boolean ?? false
    const editValue = (state as Record<string, unknown>).editValue as string ?? ''
    const invalid = (state as Record<string, unknown>).editInvalid as boolean ?? false

    const startEditing = () => {
      dispatch(editCommands.startEdit(state.focused ? item.id as string : '', String(current)))
      requestAnimationFrame(() => inputRef.current?.select())
    }

    const dispatchAndSync = (cmd: ReturnType<typeof valueCommands.setValue>) => {
      dispatch(cmd)
      // Read back the committed value from store so editValue stays in sync
      requestAnimationFrame(() => {
        const store = getAriaActions(stableId)?.getStore()
        const v = (store?.entities['__value__'] as Record<string, unknown>)?.value as number | undefined
        if (v !== undefined) dispatch(editCommands.updateEditValue(String(v)))
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
        dispatch(editCommands.cancelEdit())
      }
    }

    return (
      <div className={ax({ layout: 'bar', gap: 'md', text: state.focused ? 'bright' : undefined })} data-focused={state.focused || undefined}>
        {itemLabel && <span className={ax({ textStyle: 'body', weight: 'medium', text: 'primary' })}>{itemLabel}</span>}
        <div className={`spinbutton-group outline-none ${ax({ layout: 'bar', border: 'default', shape: 'md' })}`} data-invalid={invalid || undefined}>
          <button
            type="button"
            className={`spinbutton-btn spinbutton-btn-dec select-none ${ax({ layout: 'center', surface: 'ghost', text: 'primary' })}`}
            tabIndex={-1}
            aria-label={`Decrease ${itemLabel}`}
            aria-disabled={atMin || undefined}
            onClick={handleDecrement}
          >
            <IncrementIndicator direction="decrement" />
          </button>
          {editing ? (
            <input
              ref={inputRef}
              className={`spinbutton-input bg-transparent tabular-nums ${ax({ textStyle: 'body', weight: 'semi', text: 'primary' })}`}
              type="text"
              inputMode="numeric"
              value={editValue}
              aria-invalid={invalid || undefined}
              onChange={(e) => dispatch(editCommands.updateEditValue(e.target.value))}
              onKeyDown={handleInputKeyDown}
              onBlur={(e) => commitEdit(e.target.value)}
            />
          ) : (
            <div
              className={`spinbutton-value tabular-nums ${ax({ layout: 'center', textStyle: 'body', weight: 'semi', text: 'primary' })}`}
              onClick={startEditing}
              onDoubleClick={startEditing}
            >
              {current}
            </div>
          )}
          <button
            type="button"
            className={`spinbutton-btn spinbutton-btn-inc select-none ${ax({ layout: 'center', surface: 'ghost', text: 'primary' })}`}
            tabIndex={-1}
            aria-label={`Increase ${itemLabel}`}
            aria-disabled={atMax || undefined}
            onClick={handleIncrement}
          >
            <IncrementIndicator direction="increment" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <Aria id={stableId} pattern={pattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
