/** @catalog Form — Tab-navigated expandable field groups */
import React, { useMemo } from 'react'
import { ax } from '@styles/ax'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { KeyHandler } from '../axis/types'
import { key } from '../axis/types'
import { form } from '../pattern/roles/form'
import { useAriaZone } from '../primitives/useAriaZone'
/** A group of form entries with a label and optional expand nodeId */
export interface FormGroup<E = unknown> {
  groupLabel: string
  nodeId?: string
  entries: E[]
}

/** Minimum entry shape: must have nodeId and a unique field key */
export interface FormEntry {
  nodeId: string
  field: string
}

export interface FormProps<E extends FormEntry = FormEntry> {
  engine: CommandEngine
  store: NormalizedData
  groups: FormGroup<E>[]
  scope: string
  onActivate?: (nodeId: string) => void
  renderField: (
    props: React.HTMLAttributes<HTMLElement>,
    entry: E,
    state: NodeState,
  ) => React.ReactElement
  onEscape?: () => void
  initialFocus?: string
  'aria-label'?: string
}

export function Form<E extends FormEntry = FormEntry>({
  engine,
  store,
  groups,
  scope,
  onActivate,
  renderField,
  onEscape,
  initialFocus,
  'aria-label': ariaLabel,
}: FormProps<E>) {
  const escapeKeyMap = useMemo(() => {
    if (!onEscape) return undefined
    const map: Record<string, KeyHandler> = {
      Escape: key(['core:toggle-expand'], (ctx) => {
        if (ctx.expanded?.is) {
          return ctx.expanded.toggle()
        }
        onEscape()
        return undefined
      }),
    }
    return map
  }, [onEscape])

  const zone = useAriaZone({
    engine,
    store,
    pattern: form,
    scope,
    keyMap: escapeKeyMap,
    onActivate,
    initialFocus,
  })

  return (
    <div
      role="form"
      aria-label={ariaLabel}
      {...(zone.containerProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      {groups.map((group) => {
        const groupExpanded = group.nodeId
          ? zone.getNodeState(group.nodeId).expanded !== false
          : true

        return (
          <fieldset
            key={group.groupLabel}
            className={ax({ layout: 'column', gap: 'sm', padding: 'sm' })}
          >
            {group.groupLabel && (
              <legend className={ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}>
                {group.groupLabel}
              </legend>
            )}
            {groupExpanded && group.entries.map((entry) => (
              <React.Fragment key={`${entry.nodeId}-${entry.field}`}>
                {renderField(
                  zone.getNodeProps(entry.nodeId) as React.HTMLAttributes<HTMLElement>,
                  entry,
                  zone.getNodeState(entry.nodeId),
                )}
              </React.Fragment>
            ))}
          </fieldset>
        )
      })}
    </div>
  )
}
