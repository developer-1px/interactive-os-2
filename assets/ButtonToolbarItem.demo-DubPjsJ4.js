var e=`/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ButtonToolbar } from '../ButtonToolbar'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

export const meta = {
  slug: 'button-toolbar-item',
  category: 'item' as const,
  label: 'ButtonToolbarItem',
}

const data = createStore({
  entities: {
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
    sep: { id: 'sep', data: { label: 'Delete', separator: true } },
    del: { id: 'del', data: { label: 'Delete', disabled: true } },
  },
  relationships: { [ROOT_ID]: ['copy', 'paste', 'sep', 'del'] },
})

export function Demo() {
  return <ButtonToolbar data={data} aria-label="Demo toolbar" />
}
`;export{e as default};