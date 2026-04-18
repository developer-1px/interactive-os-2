// ⑦ Pipeline Todo — FlatLayout definePage
// 375×812 모바일 viewport — 상단 헤더 / 본문 리스트 / 하단 입력 컴포저 3단 split
import { definePage } from '@os/layout'

export const todoLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: ['auto', 'flex', 'auto'], resizable: false },
      children: ['header', 'body', 'composer'],
    },
    header: {
      data: { type: 'widget', widget: 'TodoHeader', surface: 'raised' },
    },
    body: {
      data: { type: 'widget', widget: 'TodoList', surface: 'base' },
    },
    composer: {
      data: { type: 'widget', widget: 'TodoComposer', surface: 'raised' },
    },
  },
})
