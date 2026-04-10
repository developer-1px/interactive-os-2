/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Menubar } from './Menubar'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'menubar',
  category: 'ui',
  label: 'Menubar',
}

const data: NormalizedData = createStore({
  entities: {
    file: { id: 'file', data: { label: 'File' } },
    newFile: { id: 'newFile', data: { label: 'New' } },
    open: { id: 'open', data: { label: 'Open' } },
    save: { id: 'save', data: { label: 'Save' } },
    edit: { id: 'edit', data: { label: 'Edit' } },
    undo: { id: 'undo', data: { label: 'Undo' } },
    redo: { id: 'redo', data: { label: 'Redo' } },
    view: { id: 'view', data: { label: 'View' } },
    zoomIn: { id: 'zoomIn', data: { label: 'Zoom In' } },
    zoomOut: { id: 'zoomOut', data: { label: 'Zoom Out' } },
  },
  relationships: {
    [ROOT_ID]: ['file', 'edit', 'view'],
    file: ['newFile', 'open', 'save'],
    edit: ['undo', 'redo'],
    view: ['zoomIn', 'zoomOut'],
  },
})

export function Demo() {
  return <Menubar data={data} onChange={() => {}} aria-label="Application menu" />
}
