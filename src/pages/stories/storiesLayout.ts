import { definePage } from '@os/layout/flatLayout'

export const storiesLayout = definePage({
  entities: {
    root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'preview'] },
    sidebar: { data: { type: 'widget', widget: 'StoriesSidebar' } },
    preview: { data: { type: 'widget', widget: 'StoriesPreview' } },
  },
})
