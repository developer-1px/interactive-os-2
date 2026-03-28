# interactive-os — Architecture Map

> Concept Map + Maturity Tracker. Task list가 아님.
> **갱신 시점:** 모듈 추가/삭제 시 행 갱신. Maturity·Gaps는 /retro 시 반영.
> **Maturity:** Concept → Prototype → Validated → Integrated → Production
> **이력:** PROGRESS-ARCHIVE.md (체크리스트 시절 전체 이력)

## Store (L1)

| Module | Maturity | Gaps |
|--------|----------|------|
| NormalizedData | Integrated | 직렬화 미구현 |
| storeToTree | Integrated | — |
| computeStoreDiff | Integrated | — |

## Engine (L2)

| Module | Maturity | Gaps |
|--------|----------|------|
| dispatch + middleware | Integrated | — |
| Dispatch Logger | Validated | — |

## Plugins (L5 · 9종)

| Plugin | Maturity | Gaps |
|--------|----------|------|
| focusRecovery | Integrated | — |
| history | Integrated | delta-based undo/redo, navigation skip 구현. command grouping 미구현 |
| crud | Integrated | — |
| cellEdit | Integrated | Google Sheets 2모드: Delete→셀 클리어, Enter→행 이동, Mod+X/C/V 셀 클립보드 |
| search | Integrated | Mod+F 검색, Aria.Search input + Aria.SearchHighlight mark. getVisibleNodes 필터. Grid searchable prop |
| clipboard | Integrated | definePlugin 전환, TYPE 상수, canAccept 인자화, keyMap→native event 전환 완료, cutCellValue/clearCellValue 추가 |
| zodSchema | Integrated | Zod childRules → canAccept/canDelete 자동 파생, middleware 기반 |
| rename | Integrated | — |
| dnd | Integrated | — |
| spatial | Integrated | — |
| typeahead | Integrated | — |
| definePlugin | Integrated | Plugin 팩토리: name, intercepts, requires. 전 플러그인 전환 완료 |
| *permissions* | Concept | 예제만 존재 |

## Axis (L3 · 7축 + commands)

| Module | Maturity | Gaps |
|--------|----------|------|
| 7축 (navigation · selection · expand · activate · tab · value · dismiss) | Integrated | — |
| commands (focus · selection · expand · gridCol · value) | Integrated | core()에서 흡수, 각 axis가 commands+entities 소유 |

## Pattern (L4)

| Module | Maturity | Gaps |
|--------|----------|------|
| composePattern | Integrated | keyMap + config + middleware 합성 |
| edit | Integrated | — |
| pointer interaction | Integrated | — |
| examples/ (17 APG presets) | Integrated | pattern/roles/로 분리, APG 레퍼런스 구현 |
| *menubar* | Concept | 다계층 keyMap 필요 |

## Primitives (L6)

| Module | Maturity | Gaps |
|--------|----------|------|
| Aria · Aria.Item · Aria.Cell · Aria.Editable · Aria.Search · Aria.SearchHighlight | Integrated | — |
| useAria · useAriaZone · useControlledAria | Integrated | disabled 옵션 추가 (inert + focus sync 스킵). lastActiveContainer 싱글턴 미구현 (소비자 필요 시 추가). keyMap-only 경로 실전 검증 완료 (CmsLayout Mod+\\) |
| useKeyboard · useSpatialNav | Integrated | — |
| useResizer · useVirtualScroll | Validated | — |
| *가상화 (10k+ 노드)* | Concept | — |

## UI (L7 · 15종 + indicators)

| Component | Maturity | Gaps |
|-----------|----------|------|
| indicators/ (Expand·Check·Radio·Switch·Separator) | Validated | 5/18 완료, Phase 2~3 미착수 |
| TreeGrid · ListBox · TabList · Grid | Integrated | CSS module 완비 |
| Accordion · MenuList · DisclosureGroup | Integrated | CSS module 완비 |
| Combobox · RadioGroup · SwitchGroup | Integrated | CSS module 완비 |
| Kanban · Slider · Spinbutton | Integrated | CSS module 완비 |
| Checkbox · Toggle · ToggleGroup · AlertDialog | Integrated | CSS module 완비, testPath 미연결(4종) |
| SpatialView | Validated | 읽기 전용 공간 탐색 컨테이너. spatialViewPreset + useSpatialNav. storymap에서 검증 |
| Toaster · Tooltip | Validated | Tooltip 데모 페이지 없음, Toaster testPath 없음 |
| chat/ (ChatFeed · ChatInput · TextBlock · CodeBlock · DiffBlock) | Prototype | 블록 렌더러 OCP, agent viewer 포팅 완료. 인터랙티브 블록(storeKey) 미실전 검증 |
| *Select* | — | Combobox 래퍼, 미구현 |
| *ContextMenu* | — | MenuList + popover, 미구현 |
| *DatePicker* | — | Grid + value + popover, 미구현 |

## Infra

| Module | Maturity | Gaps |
|--------|----------|------|
| Vitest (859 tests) · coverage-v8 · axe-core · ESLint | Integrated | — |
| Design Lint (8 rules · browser-injectable · Playwright CI) | Validated | 신규 관계 규칙(internal≤external, depth-inversion) false positive 튜닝 필요 |
| tsup (ESM+DTS) · npm exports | Integrated | — |
| CI/CD · npm publish | Integrated | — |
| pnpm health | Validated | — |

## App Shell

| Module | Maturity | Gaps |
|--------|----------|------|
| ActivityBar (CMS·UI·Viewer·Agent·Theme / internals) | Integrated | / = CMS, /viewer, /agent 1급 앱 |
| UI Docs (/ui/{name}) | Integrated | MD SSOT 완성, /publish 스킬로 7섹션 완전성 감사, 23/23 module 100% 완전 |
| Theme (/internals/theme) | Validated | MiniDemo 그리드 흡수, token 편집기, `pnpm score:design` 누락 감지. 6레이어 CSS Layer Architecture 확정 (reset/tokens/surface/interactive + module.css) |
| Viewer (markdown · source · Quick Open · dep graph) | Integrated | — |
| CMS (canvas · sidebar · i18n · detail panel · tabs · field types) | Validated | paste overwrite, viewer channel 미구현 |
| CMS Landing Tokens (landingTokens.css · CmsLanding.module.css) | Integrated | editorial 9섹션(hero→manifesto→features→patterns→showcase→journal→testimonial→cta→footer), 4 신규 노드타입 |
| Agent Viewer (multi-session · virtual scroll · HMR-safe store) | Validated | viewer channel disabled |
| Agent Chat (Agent SDK · WebSocket · session lifecycle) | Prototype | Phase A: 텍스트 채팅. Phase B/C: tool UI, permission |
| Devtools (REC · Inspector · Test Runner) | Integrated | 크로스커팅 도메인 독립, /devtools/* 라우트, ARIA tree 스냅샷 REC |
| Inspector · Command · Diff | Validated | — |
| Showcase (Plugin · Axis · Area) | Validated | Pattern/Collection → /ui 흡수 완료 |

## APG Coverage (16/19)

| Done | Not yet |
|------|---------|
| Accordion · Alert Dialog · Combobox · Dialog · Disclosure · Grid · Listbox · Menu · Radio Group · Slider · Spinbutton · Switch · Tabs · Toolbar · Tree · Treegrid | Menubar · Carousel · Feed |

*Tooltip: native popover, Window Splitter: useResizer — engine 밖 독립*
