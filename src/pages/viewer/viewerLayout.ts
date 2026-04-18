import { definePage } from '@os/layout/flatLayout'

export const baseLayout = definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.13, 'flex'] }, children: ['sidebar', 'content'] },
    // chrome container — island depth via shadow (raised), NOT glass
    sidebar:   { data: { type: 'widget', widget: 'ViewerSidebar', surface: 'raised' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'sort-bar', 'main', 'miller'] },
    // chrome container — solid bar. floating glass goes on ACTION CLUSTERS inside the widget
    toolbar:   { data: { type: 'widget', widget: 'ViewerToolbar', surface: 'base' } },
    'sort-bar':{ data: { type: 'widget', widget: 'ViewerSortBar', surface: 'base', hidden: false } },
    main:      { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'], resizable: true }, children: ['tree-area', 'preview'] },
    // content — solid for legibility (Apple HIG 2025)
    'tree-area': { data: { type: 'widget', widget: 'ViewerTreeGrid', surface: 'base', hidden: false } },
    preview:   { data: { type: 'widget', widget: 'ViewerPreview', surface: 'sunken', hidden: false } },
    miller:    { data: { type: 'widget', widget: 'ViewerMiller', hidden: true, fill: true } },
  },
})
