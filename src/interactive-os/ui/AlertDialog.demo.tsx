/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { AlertDialog } from './AlertDialog'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

export const meta = {
  slug: 'alert-dialog',
  category: 'ui',
  label: 'AlertDialog',
}

const data: NormalizedData = createStore({
  entities: {
    message: { id: 'message', data: { label: 'Are you sure you want to delete this item?' } },
    confirm: { id: 'confirm', data: { label: 'Delete' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: { [ROOT_ID]: ['message', 'confirm', 'cancel'] },
})

export function Demo() {
  return <AlertDialog data={data} onChange={() => {}} aria-label="Confirm deletion" />
}
