/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { MenuItem } from './MenuItem'
import { MenuList } from '../MenuList'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

export const meta = {
  slug: 'menu-item',
  category: 'item' as const,
  label: 'MenuItem',
}

const data = createStore({
  entities: {
    'cut': { id: 'cut', data: { label: 'Cut' } },
    'copy': { id: 'copy', data: { label: 'Copy' } },
    'paste': { id: 'paste', data: { label: 'Paste' } },
    'delete': { id: 'delete', data: { label: 'Delete' } },
  },
  relationships: { [ROOT_ID]: ['cut', 'copy', 'paste', 'delete'] },
})

const renderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) =>
  MenuItem(props, node, state)

export function Demo() {
  return <MenuList data={data} renderItem={renderItem} aria-label="Menu item demo" />
}
