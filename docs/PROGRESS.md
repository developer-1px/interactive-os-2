# interactive-os — Architecture Map

> Concept Map + Maturity Tracker. Task list가 아님. > **갱신 시점:** 모듈 추가/삭제 시 행 갱신. Maturity·Gaps는 /retro 시 반영. > **Maturity:** Concept → Prototype → Validated → Integrated → Production
> **이력:** PROGRESS-ARCHIVE.md (체크리스트 시절 전체 이력)

## Store (L1)

| Module | Maturity | Gaps |
|--------|----------|------|
| NormalizedData | Integrated | 직렬화 미구현 |
| storeToInspectorTree | Integrated | — |
| computeStoreDiff | Integrated | — |
| createSingleNodeStore | Integrated | 단일/순차 노드 NormalizedData 헬퍼 |
| extractSubtree / mergeSubtree | Integrated | 서브트리 추출·병합 범용 연산, clipboard·DnD 공용 |

## Engine (L2)

| Module | Maturity | Gaps |
|--------|----------|------|
| dispatch + middleware | Integrated | EffectContext: plugin DOM effect 지원 |
| validator | Integrated | ValidatorFn 슬롯, CommandResult 반환, plugin 자동 수집, mutation command 자동 검증 |
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
| clipboard | Integrated | NormalizedData 버퍼 수렴 (ClipboardEntry 제거), extractSubtree/mergeSubtree store 연산 사용, serialize/deserialize 브릿지, multi-select, Mod+D |
| zodSchema | Integrated | validator 패턴 전환 (middleware 제거), crud/dnd/clipboard 전 경로 구조 무결성 검증, CommandResult reject 시그널 |
| form | Prototype | Zod entityRules 기반 값 검증 (레거시). form 패턴 신규: navigate('natural') + expand, Tab 순회 표준 |
| rename | Integrated | — |
| dnd | Integrated | — |
| spatial | Integrated | — |
| typeahead | Integrated | — |
| urlSync | Integrated | v2: parser 전략 객체(hash/search/path), push/replace, commandFilter. useUrlSync 훅(popstate→onChange) |
| autoscroll | Prototype | MutationObserver+IntersectionObserver 기반 자동스크롤. Plugin.useEffect 첫 적용 |
| definePlugin | Integrated | Plugin 팩토리: name, intercepts, requires, useEffect. 전 플러그인 전환 완료 |
| *permissions* | Concept | 예제만 존재 |

## Axis (L3 · 8축 + commands)

| Module | Maturity | Gaps |
|--------|----------|------|
| 8축 (navigation · selection · expand · activate · tab · value · dismiss · edit) | Integrated | — |
| commands (focus · selection · expand · gridCol · value · edit) | Integrated | core()에서 흡수, 각 axis가 commands+entities 소유 |
| triggerPopup | Prototype | click/hover/focus/manual 트리거 → ARIA 연결 미완 (axis 레벨 keyMap만 구현) |

## Pattern (L4)

| Module | Maturity | Gaps |
|--------|----------|------|
| composePattern | Integrated | keyMap + config + middleware 합성. Identity에 triggerKeyMap/triggerClickMap 지원 |
| edit | Integrated | — |
| pointer interaction | Integrated | — |
| examples/ (36 APG presets) | Integrated | 34/36 ui/ 소비 구조 전환 완료. 2종 미전환(CarouselTabs·CarouselPrevNext = carousel/비-ARIA, 실전 빈도 낮아 제외) |
| menubar | Integrated | expand axis + custom handlers, multi-zone 아님 |

## Layout (L5.5)

| Module | Maturity | Gaps |
|--------|----------|------|
| flatLayout (definePage) | Integrated | LayoutNode 9타입 + LayoutBase.surface(Z 배치). definePage 팩토리 |
| widgetRegistry | Integrated | createWidgetRegistry + resolveWidget |
| layoutCommands | Prototype | setVisibility, setGap. workspaceCommands 확장 |
| layoutPlugin | Integrated | layout() plugin. workspace() requires |
| FlatLayout (ui/) | Integrated | 배치 엔진(XY+Z). OCP renderer map. 모든 렌더러 surface 적용 |

## Overlay (L5.5)

| Module | Maturity | Gaps |
|--------|----------|------|
| types (OverlayType · OverlayOptions · OverlayHandle) | Prototype | — |
| layerStack | Prototype | — |
| useOverlay | Prototype | modal(dialog) + popup(popover) + hint. 기존 UI 컴포넌트 마이그레이션 미시작 |
| useAnchorPosition | Prototype | CSS Anchor Positioning + Safari JS fallback. Tooltip 통합 미완 |
| overlay.css | Prototype | surface+shape+motion 번들 적용. /design-implement 미실행 |

## Primitives (L6)

| Module | Maturity | Gaps |
|--------|----------|------|
| Aria · Aria.Item · Aria.Cell · Aria.Editable · Aria.Search · Aria.SearchHighlight · Aria.Panel · Aria.Trigger | Integrated | Part 7종. Panel(slotProps 렌더링, panelVisibility), Trigger(triggerKeyMap/clickMap, aria-haspopup/expanded). aria-multiselectable 자동 출력 |
| useAria · useAriaZone · useControlledAria | Integrated | onFocusChange 콜백 추가. disabled 옵션. keyMap-only 경로 검증 완료 (CmsLayout Mod+\\) |
| useKeyMap | Integrated | 레이아웃 레벨 키 캡처 (React onKeyDown + findMatchingKey). src/hooks에서 OS로 이동 |
| useCommand · bindingRegistry | Integrated | 이름 있는 커맨드 핸들러 + 전역 바인딩 레지스트리. DEV 전용. inspector 양방향 조회(byNode/byCommand) |
| useKeyboard · useSpatialNav | Integrated | — |
| useResizer · useVirtualScroll | Integrated | plugins/로 이동. virtualScroll() definePlugin 래퍼 + useVirtualScrollState 훅 이중 구조 |
| VirtualCodeBlock | Integrated | 500줄+ 코드 파일 가상 스크롤. Shiki codeToTokens 줄별 토큰 캐시 |
| shikiUtils | Integrated | CodeBlock/VirtualCodeBlock 공유 유틸 (theme, lang map, escape) |
| *가상화 (10k+ 노드)* | Concept | — |

## UI (L7 · 15종 + indicators)

| Component | Maturity | Gaps |
|-----------|----------|------|
| indicators/ (Expand·Check·Radio·Switch·Separator) | Validated | 5/18 완료, Phase 2~3 미착수 |
| **AriaComponentProps** (공통 인터페이스) | Integrated | data/plugins/renderItem/onChange/onActivate/onFocusChange/className. mergeRenderers, getNodeLabel. 전 ui/ 컴포넌트 통일 완료 |
| **ListBoxGrouped** | Integrated | listboxGrouped pattern 기반 별도 완성품. 동적 childRole(group/option) |
| TreeGrid · TreeView · ListBox · TabList · Grid | Integrated | AriaComponentProps 통일, TabList manual prop 추가, TreeGrid Cell re-export. TreeView: Aria 프리미티브 기반 재작성, typeahead 기본 포함 |
| Accordion · MenuList · DisclosureGroup | Integrated | AriaComponentProps 통일 |
| Combobox · RadioGroup · SwitchGroup | Integrated | AriaComponentProps 통일 |
| Kanban · Slider · Spinbutton | Integrated | AriaComponentProps 통일, Slider/Spinbutton useId() 전환 |
| Checkbox · Toggle · ToggleGroup · AlertDialog | Integrated | AriaComponentProps 통일 |
| MenuButton · Menubar · Toolbar | Integrated | AriaComponentProps 통일. MenuButton useAria 직접 사용 (popup 패턴) |
| Alert · Link · Meter · Feed · Table · WindowSplitter | Validated | 신규 ui/ 완성품. 단순 패턴 래핑 |
| ButtonToggle · CheckboxMixed · RadioGroupActivedescendant · MenuActivedescendant | Validated | pattern variant별 별도 완성품 (Pattern=identity 원칙) |
| Form | Validated | useAriaZone 기반 Tab-navigated form. generic FormGroup/FormEntry. CMS DetailPanel에서 검증 |
| SpatialView | Validated | 읽기 전용 공간 탐색 컨테이너. spatialViewPreset + useSpatialNav. storymap에서 검증 |
| Toaster · Tooltip | Validated | Tooltip 데모 페이지 없음, Toaster testPath 없음 |
| chat/ (ChatFeed · Composer · TextBlock · CodeBlock · DiffBlock) | Prototype | 블록 렌더러 OCP, agent viewer 포팅 완료. Composer ghost text autocomplete (slash command). 인터랙티브 블록(storeKey) 미실전 검증. **Perf:** MarkdownViewer memo화, 블록 컴포넌트 memo, StreamingTextBlock `\n` pacing + 코드펜스 보류 |
| A2UISurface | Prototype | A2UI JSON → 우리 UI 컴포넌트 렌더링. 읽기 전용. 15/18 Basic Catalog 매핑. action 미구현 |
| *Select* | — | Combobox 래퍼, 미구현 |
| *ContextMenu* | — | MenuList + popover, 미구현 |
| **DatePicker · CalendarGrid** | Validated | 첫 composite ui/ 완성품. useEngine + useAriaZone(calendarGrid) + dialog focus trap. Gap 3 해소 |
| **SelectionOverlay** | Validated | 범용 selection overlay. useRectTracker(rAF) + 포커스/호버/멀티셀렉션 rect + 라벨. CMS Focused CSS 12개 제거 |

## Infra

| Module | Maturity | Gaps |
|--------|----------|------|
| Vitest (1306 tests) · coverage-v8 · axe-core · ESLint | Integrated | — |
| Claude Harness (12 hooks · 29 skills · /improve-skill) | Validated | 실전 오탐 튜닝 필요. rule 24 single-entry 권장 |
| Single Entry (ui/layout/schema/advanced) | Validated | 4 barrel exports + tsup 4 entry + package.json 정리 + hook rule 24. pages 마이그레이션 별도 plan |
| Design Lint (8 rules · browser-injectable · Playwright CI) | Validated | 신규 관계 규칙(internal≤external, depth-inversion) false positive 튜닝 필요 |
| tsup (ESM+DTS) · npm exports | Integrated | — |
| CI/CD · npm publish | Integrated | — |
| pnpm health | Validated | — |

## App Shell

| Module | Maturity | Gaps |
|--------|----------|------|
| ActivityBar (CMS·UI·Viewer·Agent·Theme / internals) | Integrated | / = CMS, /viewer, /agent 1급 앱 |
| UI Docs (/ui/{name}) | Integrated | MD SSOT 완성, /publish 스킬로 7섹션 완전성 감사, 23/23 module 100% 완전 |
| Theme (/internals/theme) | Validated | MiniDemo 그리드 흡수, token 편집기, `pnpm score:design` 누락 감지. 6레이어 CSS Layer Architecture 확정. **Pit of Success 불변량 3종**: surface-color 페어링, depth 5단계 레벨, radius-seed 비율 파생 |
| Viewer (Finder 스타일 · NavList 사이드바 · 리스트/컬럼뷰 · sort/filter · follow-focus preview) | Validated | Finder 메타포 전환 완료. TreeGrid X-ray(Name/Type/LOC 정렬+필터), MillerColumns 컬럼뷰, FileIcon 통일. **FilePreview OCP**: fileRenderers registry로 포맷 분기 일원화 (image/md/code), 소비자 5곳 통합 |
| CMS (canvas · sidebar · i18n · detail panel · tabs · field types) | Validated | paste overwrite, viewer channel 미구현 |
| CMS Landing Tokens (landingTokens.css · CmsLanding.module.css) | Integrated | editorial 9섹션(hero→manifesto→features→patterns→showcase→journal→testimonial→cta→footer), 4 신규 노드타입 |
| Agent Viewer (multi-session · virtual scroll · HMR-safe store) | Validated | viewer channel disabled |
| Agent Chat (Agent SDK · WebSocket · session lifecycle) | Prototype | Phase A: 텍스트 채팅. Phase B/C: tool UI, permission |
| Devtools (REC · Inspector · Test Runner) | Integrated | 크로스커팅 도메인 독립, /devtools/* 라우트, ARIA tree 스냅샷 REC |
| Inspector · Command · Diff | Validated | Source preview on click (computePlacement 범용 유틸) |
| App Inspector (engine.inspect) | Validated | 새 창 전용, Zone 계층 트리, view-level keyMap 노출 (pattern/plugin/override 출처별), bindingRegistry 통합, ARIA x-ray (노드별 role+aria-* 인라인 표시, 3탭 UI) |
| Showcase (Plugin · Axis · Area) | Validated | Pattern/Collection → /ui 흡수 완료 |
| Writer (MD 구조 편집 · 산문 프리뷰 · 파일 I/O) | Validated | 9개 트리 CRUD 조작(indent/outdent/split/merge/insert/wrap/unwrap/타입전환/navigate skip). chat 브릿지 미실전검증 |

## APG Coverage (16/19)

| Done | Not yet |
|------|---------|
| Accordion · Alert Dialog · Combobox · Dialog · Disclosure · Grid · Listbox · Menu · Menubar · Radio Group · Slider · Spinbutton · Switch · Tabs · Toolbar · Tree · Treegrid | Carousel · Feed |

*Tooltip: native popover, Window Splitter: useResizer — engine 밖 독립*
