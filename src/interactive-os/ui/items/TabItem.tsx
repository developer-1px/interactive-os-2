// ② 2026-04-05-ui-items-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { CloseIndicator } from '../indicators'

export interface TabItemOptions {
  icon?: React.ReactNode
  closable?: boolean
  onClose?: (e: React.MouseEvent) => void
  preview?: boolean
}

export function TabItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: TabItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const { icon, closable, onClose, preview } = options ?? {}

  return (
    <button
      type="button"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={`${ax({
        surface: 'ghost', role: 'item', layout: 'bar',
        interactive: 'tab', content: 'text', clamp: '1',
        textStyle: 'label', flex: '1',
      })}${preview ? ' tab-item-preview' : ''}`}
      data-selected={state.selected || undefined}
    >
      {icon && <span className={ax({ layout: 'center', flex: 'none' })}>{icon}</span>}
      <span>{label}</span>
      {closable && (
        <button
          className={ax({ role: 'item', surface: 'ghost', interactive: 'button', layout: 'center', content: 'icon' })}
          aria-label={`Close ${label}`}
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose?.(e)
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <CloseIndicator />
        </button>
      )}
    </button>
  )
}
