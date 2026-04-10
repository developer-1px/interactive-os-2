/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Toolbar } from '../Toolbar'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'toolbar-item',
  category: 'item' as const,
  label: 'ToolbarItem',
}

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold', icon: 'bold' } },
    italic: { id: 'italic', data: { label: 'Italic', icon: 'italic' } },
    underline: { id: 'underline', data: { label: 'Underline', icon: 'underline' } },
  },
  relationships: { [ROOT_ID]: ['bold', 'italic', 'underline'] },
})

export function Demo() {
  return <Toolbar data={data} aria-label="Formatting toolbar" />
}
