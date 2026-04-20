/**
 * cmux preview scenarios — defineLayout 변형 매트릭스.
 *
 * 목적: "선언만으로 N개 화면 상태를 즉시 스냅한다"의 POC.
 *   - 각 scenario는 defineLayout 변형 + Context value 조합
 *   - URL `?scenario=<id>` 쿼리로 스위치 → quickShot 반복으로 N장 자동
 *
 * 시나리오 축:
 *   default — 3 tabs, chat 활성 (기본 cmux 모습)
 *   single  — 1 tab (초기 상태, + 버튼 필요성 드러남)
 *   split   — 좌우 2 tabgroup (⌘D 결과)
 *   multi   — 6 tabs, 긴 레이블 포함 (overflow 테스트)
 *   empty   — 세션 선택 없음 (본문 전체 EmptyState)
 */
import { defineLayout } from '@os/layout/flatLayout'
import type { NormalizedData } from '@os/schema'
import type { CmuxPreviewContextValue } from './cmuxPreviewContext'

export interface CmuxScenario {
  id: string
  label: string
  page: NormalizedData
  context: CmuxPreviewContextValue
}

const baseContext: CmuxPreviewContextValue = {
  activeSessionId: 'session-1-l8m9k',
  composerPlaceholder: 'Type a message to Claude…',
  filesEmptyTitle: 'No files modified in this session',
  entitiesEmptyTitle: 'Select a session to inspect its entities',
}

// ── 공통 부품 선언 (재사용) ────────────────────────────────────
// transcript + composer vertical split body. id prefix로 충돌 방지.
const chatBody = (prefix: string) => ({
  [`${prefix}-body`]:  { data: { type: 'split' as const, direction: 'vertical' as const, sizes: ['flex' as const, 0.18], resizable: true }, children: [`${prefix}-feed`, `${prefix}-comp`] },
  [`${prefix}-feed`]:  { data: { type: 'widget' as const, widget: 'Transcript' } },
  [`${prefix}-comp`]:  { data: { type: 'widget' as const, widget: 'ComposerMock', padding: 'sm' as const } },
})

// ── S1. default — 3 tabs (현재 MVP와 동일) ────────────────────
export const scenarioDefault: CmuxScenario = {
  id: 'default',
  label: 'default — 3 tabs (Chat / Files / Entities)',
  page: defineLayout({
    entities: {
      root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
      sidebar: { data: { type: 'widget', widget: 'WorkspaceList' } },
      main:    { data: { type: 'tabgroup', activeTabId: 't-chat' }, children: ['t-chat', 't-files', 't-entities'] },
      't-chat':     { data: { type: 'tab', label: 'Chat — session-1' }, children: ['chat-body'] },
      ...chatBody('chat'),
      't-files':    { data: { type: 'tab', label: 'Files' }, children: ['files-body'] },
      'files-body': { data: { type: 'widget', widget: 'EmptyFiles' } },
      't-entities':    { data: { type: 'tab', label: 'Entities' }, children: ['entities-body'] },
      'entities-body': { data: { type: 'widget', widget: 'EmptyEntities' } },
      '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't-chat' } },
    },
  }),
  context: baseContext,
}

// ── S2. single — 1 tab (초기/온보딩 상태. + 버튼 필요성 드러냄) ─
export const scenarioSingle: CmuxScenario = {
  id: 'single',
  label: 'single — 1 tab (onboarding)',
  page: defineLayout({
    entities: {
      root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
      sidebar: { data: { type: 'widget', widget: 'WorkspaceList' } },
      main:    { data: { type: 'tabgroup', activeTabId: 't-chat' }, children: ['t-chat'] },
      't-chat': { data: { type: 'tab', label: 'Chat — session-1' }, children: ['chat-body'] },
      ...chatBody('chat'),
      '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't-chat' } },
    },
  }),
  context: baseContext,
}

// ── S3. split — 좌우 2 tabgroup (⌘D 결과) ──────────────────────
export const scenarioSplit: CmuxScenario = {
  id: 'split',
  label: 'split — 2 tabgroup (⌘D horizontal)',
  page: defineLayout({
    entities: {
      root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'work'] },
      sidebar: { data: { type: 'widget', widget: 'WorkspaceList' } },
      work:    { data: { type: 'split', direction: 'horizontal', sizes: ['flex', 'flex'], resizable: true }, children: ['tg-left', 'tg-right'] },
      'tg-left':  { data: { type: 'tabgroup', activeTabId: 'tL-chat' }, children: ['tL-chat'] },
      'tL-chat':  { data: { type: 'tab', label: 'Chat — session-1' }, children: ['tL-body'] },
      ...chatBody('tL'),
      'tg-right': { data: { type: 'tabgroup', activeTabId: 'tR-files' }, children: ['tR-files', 'tR-entities'] },
      'tR-files':    { data: { type: 'tab', label: 'Files' }, children: ['tR-fb'] },
      'tR-fb':       { data: { type: 'widget', widget: 'EmptyFiles' } },
      'tR-entities': { data: { type: 'tab', label: 'Entities' }, children: ['tR-eb'] },
      'tR-eb':       { data: { type: 'widget', widget: 'EmptyEntities' } },
      '__focus': { data: { type: 'state', focusedTabgroupId: 'tg-left', focusedTabId: 'tL-chat' } },
    },
  }),
  context: baseContext,
}

// ── S4. multi — 6 tabs, 긴 레이블 포함 (overflow 테스트) ────────
export const scenarioMulti: CmuxScenario = {
  id: 'multi',
  label: 'multi — 6 tabs (overflow + long label)',
  page: defineLayout({
    entities: {
      root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
      sidebar: { data: { type: 'widget', widget: 'WorkspaceList' } },
      main:    { data: { type: 'tabgroup', activeTabId: 't2' }, children: ['t1', 't2', 't3', 't4', 't5', 't6'] },
      t1: { data: { type: 'tab', label: 'Chat — session-1' }, children: ['t1-b'] },
      t2: { data: { type: 'tab', label: 'Chat — CMS flat refactor' }, children: ['t2-b'] },
      t3: { data: { type: 'tab', label: 'Chat — experiment' }, children: ['t3-b'] },
      t4: { data: { type: 'tab', label: 'Files' }, children: ['t4-b'] },
      t5: { data: { type: 'tab', label: 'Entities' }, children: ['t5-b'] },
      t6: { data: { type: 'tab', label: 'Logs — refactor todoStore to use defineCommands (very long)' }, children: ['t6-b'] },
      't1-b': { data: { type: 'widget', widget: 'Transcript' } },
      't2-b': { data: { type: 'widget', widget: 'Transcript' } },
      't3-b': { data: { type: 'widget', widget: 'Transcript' } },
      't4-b': { data: { type: 'widget', widget: 'EmptyFiles' } },
      't5-b': { data: { type: 'widget', widget: 'EmptyEntities' } },
      't6-b': { data: { type: 'widget', widget: 'EmptyEntities' } },
      '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't2' } },
    },
  }),
  context: baseContext,
}

// ── S5. empty — 세션 선택 없음 ─────────────────────────────────
export const scenarioEmpty: CmuxScenario = {
  id: 'empty',
  label: 'empty — no session selected',
  page: defineLayout({
    entities: {
      root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
      sidebar: { data: { type: 'widget', widget: 'WorkspaceList' } },
      main:    { data: { type: 'widget', widget: 'EmptyEntities' } },
    },
  }),
  context: {
    ...baseContext,
    activeSessionId: '',
    entitiesEmptyTitle: 'Select a session from the sidebar to begin',
  },
}

export const SCENARIOS: CmuxScenario[] = [
  scenarioDefault,
  scenarioSingle,
  scenarioSplit,
  scenarioMulti,
  scenarioEmpty,
]

export function getScenario(id: string | null): CmuxScenario {
  return SCENARIOS.find((s) => s.id === id) ?? scenarioDefault
}
