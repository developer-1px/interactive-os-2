/** @catalog 단일/다중 선택 리스트 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps, ItemSlots } from './types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/roles/listbox'
import { history } from '../plugins/history'
import { edit, replaceEditPlugin } from '../plugins/edit'
import { search } from '../plugins/search'
import { ListItem, EditableListItem } from './items'

const listboxPattern = listbox()

interface ListBoxProps extends AriaComponentProps {
  enableEditing?: boolean
  searchable?: boolean
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  autoFocus?: boolean
}

function makeRenderItem(editable: boolean, slots?: ItemSlots) {
  const Item = editable ? EditableListItem : ListItem
  if (!slots) return (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, item, state)
  return (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
    Item(props, item, state, {
      icon: slots.icon?.(item, state),
      rightContent: slots.rightContent?.(item, state),
    })
}

export function ListBox({
  data,
  plugins = [history()],
  onChange,
  renderItem,
  itemSlots,
  enableEditing = false,
  searchable = false,
  onActivate,
  onFocusChange,
  keyMap,
  autoFocus,
  className: _className,
  'aria-label': ariaLabel,
}: ListBoxProps) {
  const defaultRenderer = React.useMemo(() => makeRenderItem(enableEditing, itemSlots), [enableEditing, itemSlots])
  const resolvedRenderItem = renderItem ?? defaultRenderer
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
      <Aria.Item render={resolvedRenderItem} />
    </Aria>
  )
}
