// Stage 4 — layout (FlatLayout definePage)
// docs/research/pipeline/todo/ — 파이프라인 크리티크 baseline
import { definePage } from '@os/layout'

export const todoLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex', 'auto'], resizable: false },
      children: ['header', 'list', 'input'],
    },
    header: {
      data: { type: 'widget', widget: 'TodoHeader' },
    },
    list: {
      data: { type: 'widget', widget: 'TodoList' },
    },
    input: {
      data: { type: 'widget', widget: 'TodoInput' },
    },
  },
})
