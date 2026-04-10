/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ButtonToolbar } from './ButtonToolbar'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'button-toolbar',
  category: 'ui',
  label: 'ButtonToolbar',
}

const data: NormalizedData = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
    sep1: { id: 'sep1', data: { label: '', separator: true } },
    alignLeft: { id: 'alignLeft', data: { label: 'Align Left' } },
  },
  relationships: {
    [ROOT_ID]: ['bold', 'italic', 'underline', 'sep1', 'alignLeft'],
  },
})

export function Demo() {
  return <ButtonToolbar data={data} onChange={() => {}} aria-label="Text formatting" />
}
