// /playground 초기 레이아웃 — cmux 구조(tabgroup + surface widget) + __focus + __picker.
// __picker: targetTabId가 null이 아니면 PickerRoot가 PickerDialog 렌더.
//           EmptySlot의 +버튼과 ⌘P 단축키가 둘 다 이 state를 set하는 단일 진입점.
import { defineLayout } from '@os/layout/flatLayout'
import type { FocusStateData } from '@os/layout/layoutCommands'
import { FOCUS_STATE_ID } from '@os/layout/layoutCommands'

export const PICKER_STATE_ID = '__picker'

export interface PickerStateData extends Record<string, unknown> {
  type: 'state'
  targetTabId: string | null
}

export const PLAYGROUND_INITIAL = defineLayout({
  entities: {
    root:      { data: { type: 'tabgroup', activeTabId: 't1' }, children: ['t1'] },
    t1:        { data: { type: 'tab', label: 'Untitled', contentType: 'widget', contentRef: '' }, children: ['t1-body'] },
    't1-body': { data: { type: 'widget', widget: 'PlaygroundSurface' } },

    // Floating overlays — canvas 위에 겹쳐 뜨는 대화 UI.
    'composer-float':    { data: { type: 'floating', anchor: 'float-bottom' }, children: ['composer-widget'] },
    'composer-widget':   { data: { type: 'widget', widget: 'PlaygroundComposer' } },
    'subtitle-float':    { data: { type: 'floating', anchor: 'float-top-center' }, children: ['subtitle-widget'] },
    'subtitle-widget':   { data: { type: 'widget', widget: 'PlaygroundSubtitle' } },
    // Chat log — Mod+L 로 hidden 토글. 평소엔 숨김, 필요 시 좌상단 팝업.
    'chatlog-float':     { data: { type: 'floating', anchor: 'float-top-start', hidden: true }, children: ['chatlog-widget'] },
    'chatlog-widget':    { data: { type: 'widget', widget: 'PlaygroundChatLog' } },

    [FOCUS_STATE_ID]:  { data: { type: 'state', focusedTabgroupId: 'root', focusedTabId: 't1' } satisfies FocusStateData },
    [PICKER_STATE_ID]: { data: { type: 'state', targetTabId: null } satisfies PickerStateData },
  },
})

/** FlatLayout 인스턴스 id — flatLayoutRegistry 에서 외부 dispatch 시 사용 (LLM tool bridge). */
export const PLAYGROUND_CANVAS_ID = 'playground-canvas'
