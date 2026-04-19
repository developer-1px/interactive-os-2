import { definePage } from '@os/layout/flatLayout'

export const baseLayout = definePage({
  entities: {
    // root split — containerPreset('split.root')이 padding:'sm' 자동 주입.
    // 모든 면이 공통 ground 위에 inset된 island로 떠오른다.
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.13, 'flex'] }, children: ['sidebar', 'content'] },
    // definePage는 배치만 소유한다. 각 widget의 surface/재질은 위젯 컴포넌트 자체가 ax()로 소유.
    sidebar:   { data: { type: 'widget', widget: 'ViewerSidebar' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'main', 'miller'] },
    toolbar:   { data: { type: 'widget', widget: 'ViewerToolbar' } },
    main:      { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'], resizable: true }, children: ['tree-area', 'preview'] },
    // content widgets — 스스로 island가 되어 떠오른다 (raised + shape:island는 control-group 내부에서 주입)
    'tree-area': { data: { type: 'widget', widget: 'ViewerTreeGrid', hidden: false } },
    preview:   { data: { type: 'widget', widget: 'ViewerPreview', hidden: false } },
    miller:    { data: { type: 'widget', widget: 'ViewerMiller', hidden: true, fill: true } },
  },
})
