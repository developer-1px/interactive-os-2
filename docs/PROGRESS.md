# interactive-os — Architecture Map

> Concept Map + Maturity Tracker. Task list가 아님.
> **갱신 시점:** 모듈 추가/삭제 시 행 갱신. Maturity·Gaps는 /retro 시 반영.
> **Maturity:** Concept → Prototype → Validated → Integrated → Production
> **이력:** PROGRESS-ARCHIVE.md (체크리스트 시절 전체 이력)

## Store (L1)

| Module | Maturity | Gaps |
|--------|----------|------|
| NormalizedData | Integrated | 직렬화 미구현 |
| storeToInspectorTree | Integrated | — |
| computeStoreDiff | Integrated | — |
| createSingleNodeStore | Integrated | 단일/순차 노드 NormalizedData 헬퍼 |

## Engine (L2)

| Module | Maturity | Gaps |
|--------|----------|------|
| dispatch + middleware | Integrated | EffectContext: plugin DOM effect 지원 |
| defineCommand | Integrated | Phase 2: engine handler registry 전환 |
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
| zodSchema | Integrated | Zod childRules → canAccept/canDelete 자동 파생, middleware 기반. ZodSchema 타입 export |
| form | Prototype | Zod entityRules 기반 값 검증, __errors__/__touched__ 메타 엔티티, submit/reset/touch 커맨드 |
| rename | Integrated | — |
| dnd | Integrated | — |
| spatial | Integrated | — |
| typeahead | Integrated | — |
| autoscroll | Prototype | MutationObserver+IntersectionObserver 기반 자동스크롤. Plugin.useEffect 첫 적용 |
| definePlugin | Integrated | Plugin 팩토리: name, intercepts, requires, useEffect. 전 플러그인 전환 완료 |
| *permissions* | Concept | 예제만 존재 |

## Axis (L3 · 8축 + commands)

| Module | Maturity | Gaps |
|--------|----------|------|
| 8축 (navigation · selection · expand · activate · tab · value · dismiss · edit) | Integrated | — |
| commands (focus · selection · expand · gridCol · value · edit) | Integrated | core()에서 흡수, 각 axis가 commands+entities 소유 |

## Pattern (L4)

| Module | Maturity | Gaps |
|--------|----------|------|
| composePattern | Integrated | keyMap + config + middleware 합성 |
| edit | Integrated | — |
| pointer interaction | Integrated | — |
| examples/ (36 APG presets) | Integrated | 34/36 ui/ 소비 구조 전환 완료. 2종 미전환(CarouselTabs·CarouselPrevNext = carousel/비-ARIA, 실전 빈도 낮아 제외) |
| menubar | Integrated | expand axis + custom handlers, multi-zone 아님 |

## Primitives (L6)

| Module | Maturity | Gaps |
|--------|----------|------|
| Aria · Aria.Item · Aria.Cell · Aria.Editable · Aria.Search · Aria.SearchHighlight | Integrated | Panel/Trigger 제거 완료. state.slotProps로 slot ARIA 전달. Part 5종만 |
| useAria · useAriaZone · useControlledAria | Integrated | onFocusChange 콜백 추가. disabled 옵션. keyMap-only 경로 검증 완료 (CmsLayout Mod+\\) |
| useKeyboard · useSpatialNav | Integrated | — |
| useResizer · useVirtualScroll | Validated | — |
| *가상화 (10k+ 노드)* | Concept | — |

## UI (L7 · 15종 + indicators)

| Component | Maturity | Gaps |
|-----------|----------|------|
| indicators/ (Expand·Check·Radio·Switch·Separator) | Validated | 5/18 완료, Phase 2~3 미착수 |
| **AriaComponentProps** (공통 인터페이스) | Integrated | data/plugins/renderItem/onChange/onActivate/onFocusChange/className. mergeRenderers, getNodeLabel. 전 ui/ 컴포넌트 통일 완료 |
| **ListBoxGrouped** | Integrated | listboxGrouped pattern 기반 별도 완성품. 동적 childRole(group/option) |
| TreeGrid · ListBox · TabList · Grid | Integrated | AriaComponentProps 통일, TabList manual prop 추가, TreeGrid Cell re-export |
| Accordion · MenuList · DisclosureGroup | Integrated | AriaComponentProps 통일 |
| Combobox · RadioGroup · SwitchGroup | Integrated | AriaComponentProps 통일 |
| Kanban · Slider · Spinbutton | Integrated | AriaComponentProps 통일, Slider/Spinbutton useId() 전환 |
| Checkbox · Toggle · ToggleGroup · AlertDialog | Integrated | AriaComponentProps 통일 |
| MenuButton · Menubar · Toolbar | Integrated | AriaComponentProps 통일. MenuButton useAria 직접 사용 (popup 패턴) |
| Alert · Link · Meter · Feed · Table · WindowSplitter | Validated | 신규 ui/ 완성품. 단순 패턴 래핑 |
| ButtonToggle · CheckboxMixed · RadioGroupActivedescendant · MenuActivedescendant | Validated | pattern variant별 별도 완성품 (Pattern=identity 원칙) |
| Form | Prototype | Zod 기반 폼 검증 UI, listbox 패턴 + form 플러그인 |
| SpatialView | Validated | 읽기 전용 공간 탐색 컨테이너. spatialViewPreset + useSpatialNav. storymap에서 검증 |
| Toaster · Tooltip | Validated | Tooltip 데모 페이지 없음, Toaster testPath 없음 |
| chat/ (ChatFeed · Composer · TextBlock · CodeBlock · DiffBlock) | Prototype | 블록 렌더러 OCP, agent viewer 포팅 완료. Composer ghost text autocomplete (slash command). 인터랙티브 블록(storeKey) 미실전 검증. **Perf:** MarkdownViewer memo화, 블록 컴포넌트 memo, StreamingTextBlock `\n` pacing + 코드펜스 보류 |
| *Select* | — | Combobox 래퍼, 미구현 |
| *ContextMenu* | — | MenuList + popover, 미구현 |
| **DatePicker · CalendarGrid** | Validated | 첫 composite ui/ 완성품. useEngine + useAriaZone(calendarGrid) + dialog focus trap. Gap 3 해소 |
| **SelectionOverlay** | Validated | 범용 selection overlay. useRectTracker(rAF) + 포커스/호버/멀티셀렉션 rect + 라벨. CMS Focused CSS 12개 제거 |

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
| Inspector · Command · Diff | Validated | Source preview on click (computePlacement 범용 유틸) |
| App Inspector (engine.inspect) | Prototype | engine capability 직렬화 — commands, keyMap, plugins, state, plugin extras |
| Showcase (Plugin · Axis · Area) | Validated | Pattern/Collection → /ui 흡수 완료 |

## APG Coverage (16/19)

| Done | Not yet |
|------|---------|
| Accordion · Alert Dialog · Combobox · Dialog · Disclosure · Grid · Listbox · Menu · Menubar · Radio Group · Slider · Spinbutton · Switch · Tabs · Toolbar · Tree · Treegrid | Carousel · Feed |

*Tooltip: native popover, Window Splitter: useResizer — engine 밖 독립*
