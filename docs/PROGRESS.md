# interactive-os — Architecture Map

> Concept Map + Maturity Tracker. Task list가 아님.
> **갱신 시점:** 모듈 추가/삭제 시 행 갱신. Maturity·Gaps는 /retro 시 반영.
> **Maturity:** Concept → Prototype → Validated → Integrated → Production
> **이력:** PROGRESS-ARCHIVE.md (체크리스트 시절 전체 이력)

## Core

| Module | Maturity | Gaps |
|--------|----------|------|
| Store (NormalizedData) | Integrated | 직렬화 미구현 |
| Engine (dispatch + middleware) | Integrated | — |
| Dispatch Logger | Validated | — |

## Plugins (8종)

| Plugin | Maturity | Gaps |
|--------|----------|------|
| core (focus · selection · expand) | Integrated | — |
| focusRecovery | Integrated | — |
| history | Integrated | delta-based undo/redo, navigation skip 구현. command grouping 미구현 |
| crud | Integrated | — |
| clipboard | Integrated | definePlugin 전환, TYPE 상수, canAccept 인자화, keyMap→native event 전환 완료 |
| zodSchema | Integrated | Zod childRules → canAccept/canDelete 자동 파생, middleware 기반 |
| rename | Integrated | — |
| dnd | Integrated | — |
| spatial | Integrated | — |
| typeahead | Integrated | — |
| definePlugin | Integrated | Plugin 팩토리: name, intercepts, requires. 전 플러그인 전환 완료 |
| *permissions* | Concept | 예제만 존재 |

## Behavior (5축 + 18 presets)

| Module | Maturity | Gaps |
|--------|----------|------|
| composePattern + 6축 (edit 추가) | Integrated | — |
| pointer interaction | Integrated | — |
| 17 presets (listbox~spinbutton) | Integrated | — |
| *menubar* | Concept | 다계층 keyMap 필요 |

## Hooks & Components

| Module | Maturity | Gaps |
|--------|----------|------|
| Aria · Aria.Item · Aria.Cell · Aria.Editable | Integrated | — |
| useAria · useAriaZone · useControlledAria | Integrated | lastActiveContainer 싱글턴 미구현 (소비자 필요 시 추가) |
| useKeyboard · useSpatialNav | Integrated | — |
| useResizer · useVirtualScroll | Validated | — |
| *가상화 (10k+ 노드)* | Concept | — |

## UI (15종)

| Component | Maturity | Gaps |
|-----------|----------|------|
| TreeGrid · ListBox · TabList · Grid | Integrated | — |
| Accordion · MenuList · DisclosureGroup | Integrated | — |
| Combobox · RadioGroup · SwitchGroup | Integrated | — |
| Kanban · Slider · Spinbutton | Integrated | — |
| Toaster · Tooltip | Validated | Tooltip 데모 페이지 없음 |
| *Select* | — | Combobox 래퍼, 미구현 |
| *ContextMenu* | — | MenuList + popover, 미구현 |
| *DatePicker* | — | Grid + value + popover, 미구현 |

## Infra

| Module | Maturity | Gaps |
|--------|----------|------|
| Vitest (634 tests) · coverage-v8 · axe-core · ESLint | Integrated | — |
| tsup (ESM+DTS) · npm exports | Integrated | — |
| CI/CD · npm publish | Integrated | — |
| pnpm health | Validated | — |

## App Shell

| Module | Maturity | Gaps |
|--------|----------|------|
| ActivityBar (External/Internal) · routing | Integrated | createBrowserRouter + layout route 전환 완료 |
| UI Showcase (/ui/{name}) | Integrated | 18/23 testPath + 16/23 APG table 연결 완료 |
| Landing (/) · Docs (/docs) | Validated | hero + component grid, Getting Started + architecture |
| Viewer (markdown · source · Quick Open · dep graph) | Integrated | — |
| CMS (canvas · sidebar · i18n · detail panel · tabs · field types) | Validated | paste overwrite, viewer channel 미구현 |
| Agent Viewer (multi-session · virtual scroll) | Validated | viewer channel disabled |
| Inspector · Command · Diff | Validated | — |
| Showcase (Plugin · Collection · Axis · Area) | Validated | — |

## APG Coverage (16/19)

| Done | Not yet |
|------|---------|
| Accordion · Alert Dialog · Combobox · Dialog · Disclosure · Grid · Listbox · Menu · Radio Group · Slider · Spinbutton · Switch · Tabs · Toolbar · Tree · Treegrid | Menubar · Carousel · Feed |

*Tooltip: native popover, Window Splitter: useResizer — engine 밖 독립*
