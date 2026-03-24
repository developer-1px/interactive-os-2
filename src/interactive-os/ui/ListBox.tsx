import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/listbox'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { replaceEditPlugin } from '../pattern/edit'
import styles from './ListBox.module.css'

interface ListBoxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  enableEditing?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '') + (state.selected ? ' ' + styles.itemSelected : '')
  return <div {...props} className={cls}>{label}</div>
}

export function ListBox({
  data,
  plugins = [core(), history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
}: ListBoxProps) {
  const behavior = React.useMemo(
    () => listbox({ edit: enableEditing }),
    [enableEditing],
  )

  const mergedPlugins = React.useMemo(
    () => enableEditing ? [...plugins, replaceEditPlugin()] : plugins,
    [plugins, enableEditing],
  )

  return (
    <Aria
      behavior={behavior}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
