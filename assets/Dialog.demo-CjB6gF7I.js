import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { useState } from 'react'
import { Dialog } from './Dialog'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { Button } from './Button'

export const meta = {
  slug: 'dialog',
  category: 'ui',
  label: 'Dialog',
}

const data: NormalizedData = createStore({
  entities: {
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
    details: { id: 'details', data: { label: 'View Details' } },
  },
  relationships: { [ROOT_ID]: ['confirm', 'cancel', 'details'] },
})

export function Demo() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return <Button variant="ghost" onClick={() => setOpen(true)}>Open Dialog</Button>
  }

  return <Dialog data={data} onChange={() => setOpen(false)} />
}
`;export{t as n,n as t};