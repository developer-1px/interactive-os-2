// ⑦ /do UI — FlatLayout defineLayout for ax Principles page
import { defineLayout } from '@os/layout/flatLayout'

export const axPrinciplesLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.08, 'flex'], resizable: false },
      children: ['header', 'body'],
    },
    header: {
      data: { type: 'widget', widget: 'AxPrinciplesHeader' },
    },
    body: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.3, 'flex'], resizable: true },
      children: ['master', 'detail'],
    },
    master: {
      data: { type: 'widget', widget: 'AxPrinciplesMaster' },
    },
    detail: {
      data: { type: 'widget', widget: 'AxPrinciplesDetail' },
    },
  },
})
