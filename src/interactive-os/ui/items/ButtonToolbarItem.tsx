import React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { Divider } from '../Divider'
import { ax } from '@styles/ax'

/**
 * Toolbar item rendered as a <button> with optional separator and disabled state.
 * Expects node.data: { label: string, disabled?: boolean, separator?: boolean }
 */
export function ButtonToolbarItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement {
  const data = node.data as Record<string, unknown>
  const label = getNodeLabel(node)
  const isDisabled = !!data?.disabled
  const hasSeparator = !!data?.separator

  return (
    <React.Fragment>
      <button
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className={ax({
          interactive: 'button', controlSize: 'sm', padding: 'sm', content: 'text',
        })}
        disabled={isDisabled}
      >
        {label}
      </button>
      {hasSeparator && <Divider direction="vertical" />}
    </React.Fragment>
  )
}
