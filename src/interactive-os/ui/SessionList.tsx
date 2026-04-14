/** @catalog 세션 리스트 (네비게이션) */
import React from 'react'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { SessionItemOptions } from './items'
import { SessionItem } from './items'
import { NavList } from './NavList'

interface SessionListProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  /** Map of nodeId → SessionItemOptions */
  itemOptions?: (nodeId: string) => SessionItemOptions
  initialFocus?: string
  'aria-label'?: string
}

const defaultItemOptions = (): SessionItemOptions => ({})

export function SessionList({
  data,
  plugins,
  onChange,
  onActivate,
  itemOptions = defaultItemOptions,
  initialFocus,
  'aria-label': ariaLabel,
}: SessionListProps) {
  const renderItem = React.useCallback(
    (...args: Parameters<typeof SessionItem>) => {
      const [props, node, state] = args
      const id = node.id as string
      return SessionItem(props, node, state, itemOptions(id))
    },
    [itemOptions],
  )

  return (
    <NavList
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      renderItem={renderItem}
      initialFocus={initialFocus}
      aria-label={ariaLabel}
    />
  )
}
