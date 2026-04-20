import { defineLayout } from '@os/layout/defineLayout'

export const storiesLayout = defineLayout({
  entities: {
    root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true, holds: 'island' }, children: ['sidebar', 'preview'] },
    sidebar: { data: { type: 'widget', widget: 'StoriesSidebar' } },
    preview: { data: { type: 'widget', widget: 'StoriesPreview' } },
  },
})
