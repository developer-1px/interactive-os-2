import { defineLayout } from '@os/layout/defineLayout'

export const baseLayout = defineLayout({
  entities: {
    // root split — containerPreset('split.root')이 padding:'sm' 자동 주입.
    // 모든 면이 공통 ground 위에 inset된 island로 떠오른다.
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.13, 'flex'], holds: 'island' }, children: ['sidebar', 'content'] },
    // defineLayout는 배치 + 스크롤 오너를 소유한다. 각 widget의 surface/재질은 위젯 컴포넌트 자체가 ax()로 소유.
    // scroll은 콘텐츠를 담는 leaf widget에만 선언 — 부모 split/stack은 배치만.
    sidebar:   { data: { type: 'widget', widget: 'FinderSidebar', scroll: 'y' } },
    content:   { data: { type: 'stack' }, children: ['toolbar', 'main', 'miller'] },
    toolbar:   { data: { type: 'widget', widget: 'FinderToolbar' } },
    main:      { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'], resizable: true }, children: ['tree-area', 'preview'] },
    // content widgets — 스스로 island가 되어 떠오른다 (raised + shape:island는 control-group 내부에서 주입)
    'tree-area': { data: { type: 'widget', widget: 'FinderTreeGrid', hidden: false, scroll: 'y' } },
    // preview는 FilePanel이 내부 ScrollArea로 자체 스크롤 관리 — scroll 생략 (nested scroll 방지).
    preview:   { data: { type: 'widget', widget: 'FinderPreview', hidden: false } },
    miller:    { data: { type: 'widget', widget: 'FinderMiller', hidden: true, fill: true } },
  },
})
