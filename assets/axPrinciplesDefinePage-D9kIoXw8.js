var e=`// ⑦ /do UI — FlatLayout definePage for ax Principles page
import { definePage } from '@os/layout/flatLayout'

export const axPrinciplesLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.08, 'flex'], resizable: false },
      children: ['header', 'body'],
    },
    header: {
      data: { type: 'widget', widget: 'AxPrinciplesHeader', surface: 'raised' },
    },
    body: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.3, 'flex'], resizable: true },
      children: ['master', 'detail'],
    },
    master: {
      data: { type: 'widget', widget: 'AxPrinciplesMaster', surface: 'sunken' },
    },
    detail: {
      data: { type: 'widget', widget: 'AxPrinciplesDetail' },
    },
  },
})
`;export{e as default};