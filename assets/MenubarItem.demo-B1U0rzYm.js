var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Menubar } from '../Menubar'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'menubar-item',
  category: 'item' as const,
  label: 'MenubarItem',
}

const data = createStore({
  entities: {
    file: { id: 'file', data: { label: 'File' } },
    edit: { id: 'edit', data: { label: 'Edit' } },
    newFile: { id: 'newFile', data: { label: 'New File' } },
    open: { id: 'open', data: { label: 'Open' } },
    undo: { id: 'undo', data: { label: 'Undo' } },
    redo: { id: 'redo', data: { label: 'Redo' } },
  },
  relationships: {
    [ROOT_ID]: ['file', 'edit'],
    file: ['newFile', 'open'],
    edit: ['undo', 'redo'],
  },
})

export function Demo() {
  return <Menubar data={data} aria-label="Demo menubar" />
}
`;export{e as default};