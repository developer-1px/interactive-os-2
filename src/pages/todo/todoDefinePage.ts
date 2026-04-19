// Stage 4 — FlatLayout definePage: header + list + composer.
import { definePage } from '@os/layout/flatLayout'

export const todoLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex', 'auto'], resizable: false },
      children: ['header', 'list', 'composer'],
    },
    header: {
      data: { type: 'widget', widget: 'TodoHeaderWidget' },
    },
    list: {
      data: { type: 'widget', widget: 'TodoListWidget' },
    },
    composer: {
      data: { type: 'widget', widget: 'TodoComposerWidget' },
    },
  },
})
