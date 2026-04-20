// studioLayout — Studio 초기 FlatLayout. playground 기본 구조 + ExampleSidebar 2분할.
// PICKER_STATE_ID / PickerStateData는 여기 SSOT. layoutTools/playgroundWidgets가 import.
import { defineLayout } from '@os/layout/flatLayout'
import type { FocusStateData } from '@os/layout/layoutCommands'
import { FOCUS_STATE_ID } from '@os/layout/layoutCommands'

export const STUDIO_CANVAS_ID = 'studio-canvas'

/** 구 playground defaults의 PICKER_STATE_ID 승계. EmptySlot + ⌘P 단일 진입점. */
export const PICKER_STATE_ID = '__picker'

export interface PickerStateData extends Record<string, unknown> {
  type: 'state'
  targetTabId: string | null
}

export const STUDIO_INITIAL = defineLayout({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.2, 'flex'], resizable: true }, children: ['sidebar', 'canvas'] },
    sidebar:   { data: { type: 'widget', widget: 'ExampleSidebar' } },
    canvas:    { data: { type: 'tabgroup', activeTabId: 't1' }, children: ['t1'] },
    t1:        { data: { type: 'tab', label: 'Untitled', contentType: 'widget', contentRef: '' }, children: ['t1-body'] },
    't1-body': { data: { type: 'widget', widget: 'PlaygroundSurface' } },

    // Floating overlays — canvas 위에 겹쳐 뜨는 대화 UI.
    'composer-float':    { data: { type: 'floating', anchor: 'float-bottom' }, children: ['composer-widget'] },
    'composer-widget':   { data: { type: 'widget', widget: 'PlaygroundComposer' } },
    'subtitle-float':    { data: { type: 'floating', anchor: 'float-top-center' }, children: ['subtitle-widget'] },
    'subtitle-widget':   { data: { type: 'widget', widget: 'PlaygroundSubtitle' } },
    'chatlog-float':     { data: { type: 'floating', anchor: 'float-top-start', hidden: true }, children: ['chatlog-widget'] },
    'chatlog-widget':    { data: { type: 'widget', widget: 'PlaygroundChatLog' } },
    'stream-ctrl':       { data: { type: 'floating', anchor: 'float-top-center' }, children: ['stream-ctrl-w'] },
    'stream-ctrl-w':     { data: { type: 'widget', widget: 'StreamControl' } },

    [FOCUS_STATE_ID]:  { data: { type: 'state', focusedTabgroupId: 'canvas', focusedTabId: 't1' } satisfies FocusStateData },
    [PICKER_STATE_ID]: { data: { type: 'state', targetTabId: null } satisfies PickerStateData },
  },
})
