/** @catalog 단계별 진행 네비게이션 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { useTabList } from './useTabList'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { StepperItem } from './items/StepperItem'
import { ax } from '@styles/ax'
import './Stepper.css'

interface StepperProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  initialFocus?: string
}

const defaultRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  orientation: 'horizontal' | 'vertical',
): React.ReactElement =>
  StepperItem(props, node, state, { orientation })

export function Stepper({
  data,
  plugins,
  onChange,
  onActivate,
  renderItem,
  orientation = 'horizontal',
  keyMap,
  initialFocus,
  className,
  'aria-label': ariaLabel,
}: StepperProps) {
  const tl = useTabList({
    data,
    plugins,
    onChange,
    onActivate,
    keyMap,
    initialFocus,
    manual: true,
    'aria-label': ariaLabel ?? 'Steps',
  })

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)
  const isVertical = orientation === 'vertical'

  return (
    <div
      {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)}
      aria-orientation={orientation}
      className={`${(tl.rootProps as Record<string, string>).className || ''} ${ax({
        layout: isVertical ? 'stack' : 'bar'
      })} ${className ?? ''}`}
    >
      {childIds.map((id) => {
        const entity = store.entities[id]
        if (!entity) return null
        const state = tl.getItemState(id)
        const props = { ...tl.getItemProps(id), key: id } as React.HTMLAttributes<HTMLElement>
        if (renderItem) return renderItem(props, entity, state)
        return defaultRenderItem(props, entity, state, orientation)
      })}
    </div>
  )
}
