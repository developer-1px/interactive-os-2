import React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { DirectionIndicator } from '../indicators/DirectionIndicator'

/**
 * Pagination item: prev/next arrows or page number button.
 * Expects node.data: { label: string, kind: 'prev' | 'next' | 'page' | 'ellipsis', page?: number, current?: boolean, disabled?: boolean }
 */
export function PaginationItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement {
  const data = node.data as Record<string, unknown>
  const label = getNodeLabel(node)
  const kind = data?.kind as string
  const isCurrent = !!data?.current
  const isDisabled = !!data?.disabled

  if (kind === 'ellipsis') {
    return (
      <span
        className={`${ax({ role: 'control' })} ${ax.raw({ text: 'secondary' })}`}
        aria-hidden="true"
      >
        ...
      </span>
    )
  }

  if (kind === 'prev' || kind === 'next') {
    return (
      <button
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className={ax({ role: 'control', interactive: 'button', surface: 'ghost', content: 'icon' })}
        disabled={isDisabled}
        aria-label={label}
      >
        <DirectionIndicator direction={kind === 'prev' ? 'prev' : 'next'} />
      </button>
    )
  }

  return (
    <button
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={ax({ role: 'control', interactive: 'button', surface: isCurrent ? 'action' : 'ghost', tone: isCurrent ? 'accent' : undefined })}
      aria-current={isCurrent ? 'page' : undefined}
      disabled={isDisabled}
    >
      {label}
    </button>
  )
}
