// Stage 4 — FlatLayout defineLayout: header + list + composer.
import { defineLayout } from '@os/layout/defineLayout'

export const todoLayout = defineLayout({
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
