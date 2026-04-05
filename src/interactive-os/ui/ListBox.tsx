import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/roles/listbox'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { search } from '../plugins/search'
import { ax } from '@styles/ax'
import '@styles/ax.css'

const listboxPattern = listbox()

interface ListBoxProps extends AriaComponentProps {
  enableEditing?: boolean
  searchable?: boolean
  keyMap?: Record<string, (ctx: import('../pattern/types').PatternContext) => import('../engine/types').Command | void>
  autoFocus?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={ax({ layout: 'bar', gap: 'sm' })} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
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
  onActivate,
  onFocusChange,
  keyMap,
  autoFocus,
  className: _className,
  'aria-label': ariaLabel,
}: ListBoxProps) {
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
      pattern={listboxPattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      keyMap={keyMap}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
    >
      {searchable && <Aria.Search placeholder="Search..." />}
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
