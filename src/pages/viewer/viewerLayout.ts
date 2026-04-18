import { definePage } from '@os/layout/flatLayout'

export const baseLayout = definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.13, 'flex'] }, children: ['sidebar', 'content'] },
    // chrome (navigation) — island on lifted theme
    sidebar:   { data: { type: 'widget', widget: 'ViewerSidebar', surface: 'raised' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'sort-bar', 'main', 'miller'] },
    // chrome (floating bar) — glass on lifted theme (frost + tint + rim)
    toolbar:   { data: { type: 'widget', widget: 'ViewerToolbar', surface: 'overlay' } },
    'sort-bar':{ data: { type: 'widget', widget: 'ViewerSortBar', surface: 'raised', hidden: false } },
    main:      { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'], resizable: true }, children: ['tree-area', 'preview'] },
    // content — solid for legibility (Apple HIG 2025)
    'tree-area': { data: { type: 'widget', widget: 'ViewerTreeGrid', surface: 'base', hidden: false } },
    preview:   { data: { type: 'widget', widget: 'ViewerPreview', surface: 'sunken', hidden: false } },
    miller:    { data: { type: 'widget', widget: 'ViewerMiller', hidden: true, fill: true } },
  },
})
