# interactive-os — Architecture Map

> LLM 세션 시작 시 프로젝트 현황 파악용. 구조적 변경 시에만 업데이트.
> Maturity: Concept → Prototype → Validated → Integrated → Production

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
| history | Integrated | navigation skip 미처리, command grouping 없음 |
| crud | Integrated | — |
| clipboard | Integrated | — |
| rename | Integrated | — |
| dnd | Integrated | — |
| spatial | Integrated | — |
| typeahead | Integrated | — |
| *permissions* | Concept | 예제만 존재 |

## Behavior (5축 + 18 presets)

| Module | Maturity | Gaps |
|--------|----------|------|
| composePattern + 5축 | Integrated | — |
| pointer interaction | Integrated | — |
| 17 presets (listbox~spinbutton) | Integrated | — |
| *menubar* | Concept | 다계층 keyMap 필요 |

## Hooks & Components

| Module | Maturity | Gaps |
|--------|----------|------|
| Aria · Aria.Item · Aria.Cell · Aria.Editable | Integrated | — |
| useAria · useAriaZone · useControlledAria | Integrated | — |
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
| Vitest (571 tests) · axe-core · ESLint | Integrated | — |
| tsup (ESM+DTS) · npm exports | Integrated | — |
| CI/CD · npm publish | Integrated | — |
| pnpm health | Validated | — |

## App Shell

| Module | Maturity | Gaps |
|--------|----------|------|
| ActivityBar (8 layers) · routing | Integrated | — |
| Viewer (markdown · source · Quick Open · dep graph) | Integrated | — |
| CMS (canvas · sidebar · i18n · detail panel · tabs) | Validated | paste overwrite, viewer channel 미구현 |
| Agent Viewer (multi-session · virtual scroll) | Validated | viewer channel disabled |
| Inspector · Pipeline · History | Validated | — |
| Showcase (Plugin · Collection · Axis · Area) | Validated | — |

## APG Coverage (16/19)

| Done | Not yet |
|------|---------|
| Accordion · Alert Dialog · Combobox · Dialog · Disclosure · Grid · Listbox · Menu · Radio Group · Slider · Spinbutton · Switch · Tabs · Toolbar · Tree View · Treegrid | Menubar · Carousel · Feed |

*Tooltip: native popover, Window Splitter: useResizer — engine 밖 독립*
