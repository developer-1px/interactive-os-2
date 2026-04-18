import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { AlertDialog } from './AlertDialog'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { Button } from './Button'

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
  const [open, setOpen] = useState(false)

  if (!open) {
    return <Button variant="ghost" onClick={() => setOpen(true)}>Open AlertDialog</Button>
  }

  return <AlertDialog data={data} onChange={() => setOpen(false)} aria-label="Confirm deletion" />
}
`;export{t as n,n as t};