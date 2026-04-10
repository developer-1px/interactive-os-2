/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { A2UISurface } from './A2UISurface'
import type { A2UIPayload } from './a2uiAdapter'

export const meta = {
  slug: 'a2ui-surface',
  category: 'ui',
  label: 'A2UISurface',
}

const payload: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['heading', 'row'] },
    { id: 'heading', component: 'Text', text: 'Survey Results', variant: 'h3' },
    { id: 'row', component: 'Row', children: ['card1', 'card2'] },
    { id: 'card1', component: 'Card', child: 'text1' },
    { id: 'text1', component: 'Text', text: 'Satisfaction: 92%' },
    { id: 'card2', component: 'Card', child: 'text2' },
    { id: 'text2', component: 'Text', text: 'Response rate: 78%' },
  ],
}

export function Demo() {
  return <A2UISurface payload={payload} />
}
