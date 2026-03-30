import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/roles/listbox'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { search } from '../plugins/search'
import styles from './ListBox.module.css'

interface ListBoxProps extends AriaComponentProps {
  enableEditing?: boolean
  searchable?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function ListBox({
  data,
  plugins = [history()],
  onChange,
  renderItem = defaultRenderItem,
  enableEditing = false,
  searchable = false,
}: ListBoxProps) {
  const pattern = React.useMemo(
    () => listbox(),
    [],
  )

  const mergedPlugins = React.useMemo(
    () => {
      const result = [...plugins]
      if (enableEditing) { result.push(edit(), replaceEditPlugin()) }
      if (searchable) { result.push(search()) }
      return result
    },
    [plugins, enableEditing, searchable],
  )

  return (
    <Aria
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
    >
      {searchable && <Aria.Search placeholder="Search..." />}
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
