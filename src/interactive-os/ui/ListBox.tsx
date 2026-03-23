import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { listbox } from '../behaviors/listbox'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { replaceEditPlugin } from '../axes/edit'

interface ListBoxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>) => React.ReactElement
  enableEditing?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultRenderItem = (item: Record<string, unknown>, _state: NodeState, props: React.HTMLAttributes<HTMLElement>): React.ReactElement => (
  <span {...props}>
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </span>
)

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
