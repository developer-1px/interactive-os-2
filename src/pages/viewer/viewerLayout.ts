import { definePage } from '@os/layout/flatLayout'

export const baseLayout = definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.18, 'flex'] }, children: ['sidebar', 'content'] },
    sidebar:   { data: { type: 'widget', widget: 'ViewerSidebar', surface: 'sunken' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'sort-bar', 'main', 'miller'] },
    toolbar:   { data: { type: 'widget', widget: 'ViewerToolbar', surface: 'base' } },
    'sort-bar':{ data: { type: 'widget', widget: 'ViewerSortBar', surface: 'raised', hidden: false } },
    main:      { data: { type: 'split', direction: 'horizontal', sizes: ['flex', 0.35], resizable: true }, children: ['tree-area', 'preview'] },
    'tree-area': { data: { type: 'widget', widget: 'ViewerTreeGrid', surface: 'base', hidden: false } },
    preview:   { data: { type: 'widget', widget: 'ViewerPreview', surface: 'sunken', hidden: false } },
    miller:    { data: { type: 'widget', widget: 'ViewerMiller', hidden: true, fill: true } },
  },
})
