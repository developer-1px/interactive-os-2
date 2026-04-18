import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`## Backlog

- [x] vitest pool/isolate 최적화 → happy-dom 전환으로 해결 — forks→threads 전환, isolate:false 검토로 총 실행 시간 추가 감소 (현재 66초, fork 오버헤드 ~30초) — 출처: docs/0-inbox/16-[retro]test-lightweight.md (2026-03-21)
- [x] Slider.tsx 트랙 클릭 → setValue 핸들러 추가 — PRD 인터페이스에 명시됐으나 미구현. ariaRegistry로 dispatch 가능 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
- [x] axe-core 접근성 테스트 추가 (slider, spinbutton) — aria-valuenow/min/max 정합성 자동 검증 — 출처: docs/0-inbox/17-[retro]value-axis.md (2026-03-21)
- [x] Slider 데모 키힌트 확장 — 트랙 클릭, Ctrl+Z undo 안내 추가 (구현은 완료, 키힌트만 누락) — 출처: walkthrough 대조 (2026-03-21)
- [x] Spinbutton 데모 키힌트 확장 — 직접 입력(클릭→타이핑), ▲▼ 버튼, Escape 취소, Ctrl+Z undo 안내 추가 (구현은 완료, 키힌트만 누락) — 출처: walkthrough 대조 (2026-03-21)
- [x] Grid 셀 클릭 → 행 선택 테스트 추가 — grid behavior는 select() 축 사용으로 selectOnClick 자동 동작하지만 검증 테스트 없음 — 출처: docs/0-inbox/11-[retro]pointer-interaction.md (2026-03-22)
- [x] disabled 노드 클릭 → 무동작 테스트 추가 — PRD 경계#2에 명시됐으나 테스트 미작성 — 출처: docs/0-inbox/11-[retro]pointer-interaction.md (2026-03-22)
- [ ] os controlled/uncontrolled FOCUS_ID pit of failure — uncontrolled \`<Aria data={store} onChange={...}>\`에서 외부 FOCUS_ID를 data에 주입하면 onChange→setState→store 재생성 사이클 발생. 방어 로직(내부/외부 FOCUS_ID 변경 구분) 또는 문서화 검토 — 출처: Agent Viewer PoC에서 발견 (2026-03-22)
- [ ] PRD 스킬 개선: ② 산출물에 "테스트 파일" 자동 포함 체크리스트, ⑦ 금지에 "테스트 대상 순수 함수 파일 분리 예외" 규칙 추가 — retro 일치율 4/8 원인이 PRD 촘촘함 부족 — 출처: docs/0-inbox/10-[retro]viewer-tool-card-grouping.md (2026-03-22)
- [ ] viewer-channel 완성: reply tool 양방향 통신 검토, inactive 세션 입력 비활성화, 에러 핸들링(channel 미기동 시 안내), textarea 자동 높이 조절 — 출처: viewer chat channel discussion (2026-03-22)
- [ ] viewer-channel을 Claude Code 플러그인으로 패키징 — plugin.json 작성, \`--dangerously-load-development-channels\` 없이 사용 가능하도록 — 출처: viewer chat channel discussion (2026-03-22)
- [x] V5: i18n 양방향 싱크 테스트 — diffGridChanges 순수 함수 추출 + unit 테스트 — 출처: docs/0-inbox/22-[retro]grid-i18n.md (2026-03-23)
- [ ] V6: Grid + history undo 통합 테스트 — rename 후 Mod+Z → 값 복원 검증 — 출처: docs/0-inbox/22-[retro]grid-i18n.md (2026-03-23)
- [x] V9: CMS 노드 삭제 → adapter 재계산 테스트 — entity 제거 시 행 제거 확인 — 출처: docs/0-inbox/22-[retro]grid-i18n.md (2026-03-23)
- [ ] V12: rename 중 Tab 동작 — 값 커밋 후 Grid 외부 포커스 이동 (Playwright 대상) — 출처: docs/0-inbox/22-[retro]grid-i18n.md (2026-03-23)
- [ ] [P2] Command 직렬화 — 협업/로깅용 serialize/deserialize — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P2] permissions() — 노드별 Command 차단 미들웨어 — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P2] menubar behavior — 다계층 keyMap 확장 — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P2] 대용량 가상화 — 10k+ 노드 렌더링 — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P1] Select — Combobox 래퍼, input 없는 드롭다운 — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P1] ContextMenu — MenuList + popover + 우클릭/Shift+F10 — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P1] DatePicker — Grid + value 축 + popover — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P2] shadcn CLI — \`npx interactive-os add treegrid\` — 출처: PROGRESS.md 전환 (2026-03-23)
- [ ] [P1] treegrid 쇼케이스 페이지 — 실제 다중 컬럼(파일명+크기+날짜) 데이터로 treegrid 패턴 시연. 기존 treegrid 라우트는 tree로 교체됨 — 출처: discussion (2026-03-23)
- [ ] [P0] UI SDK 카탈로그 32개 장기 플랜 — 상세: docs/5-backlogs/uiSdkCatalog.md — 출처: UI SDK discussion (2026-03-23)
- [ ] [P1] Viewer lightbox — mermaid/이미지 클릭 시 전체화면 보기 — 출처: architecture snapshot discussion (2026-03-23)
- [x] [P1] edit 축 도입 — Grid.tsx editingKeyMap 접착제 제거, grid({ edit: true })로 behavior가 F2/Enter/printable/Delete 소유, Grid.tsx 순수 렌더러화 — 출처: i18n DataTable discussion (2026-03-23)
- [x] [P2] Mod+X 셀 단위 cut — Mod+C/V는 셀 특화 완료, X만 아직 행 단위 — 출처: i18n DataTable 브라우저 재현 (2026-03-23)
- [x] [P2] Delete → 셀 값 클리어 — DataTable에서 Delete=행 삭제가 아닌 셀 클리어가 자연스러움 (Page keyMap override) — 출처: i18n DataTable 브라우저 재현 (2026-03-23)
- [x] [P2] Enter confirm 후 아래 셀 이동 — 구글 시트 패턴 (Tab=오른쪽, Enter=아래) — 출처: i18n DataTable 브라우저 재현 (2026-03-23)
- [x] [P1] clipboard-overwrite 테스트 충돌 — Enter keyMap 추가로 1개 실패, 병합 시 해결 필요 — 출처: i18n DataTable Enter 추가 (2026-03-23)
- [ ] [P2] natural-tab-order zone active zone 테스트 — 코드상 동작하지만 전용 테스트 미작성. 사용처 생길 때 함께 추가 — 출처: docs/0-inbox/34-[retro]active-zone.md (2026-03-24)
- [x] [P1] trap 축 이름 재검토 → dismiss()로 rename 완료 — tab 전략 축 도입 후 trap(Escape 닫기, 포커스 복원)과 tab trap 전략이 이름 충돌. rename 또는 책임 재분배 필요 — 출처: CMS tab flow discussion (2026-03-24)
- [ ] [P1] NavList group 지원 — role="group"으로 카테고리 그룹핑 + 단일 포커스. 현재는 Aria + navlist behavior 직접 사용으로 우회 — 출처: UI docs sidebar discussion (2026-03-24)
- [ ] [P1] completeness 86%→100% — 컴포넌트 코드 변경 필요. Toggle/ToggleGroup variant(outline,ghost,destructive)+size, Toolbar variant+size, Spinbutton input-height+icon slot, TextInput/Combobox icon slot(leftSection/rightSection), RadioGroup indeterminate+indicator, Checkbox indeterminate — 출처: score:completeness 루프 수렴 (2026-03-25)
- [ ] [P0] 채팅 블록 UI 컴포넌트 — LLM 에이전트가 사용할 리치 블록 카탈로그. 필수 7개: CodeBlock, MarkdownBlock, ProgressStep, Terminal, DiffView, AgentStep, StatCard/MetricBar — 출처: LLM 시대 UI discussion + AI 제품 블록 전수 조사 (2026-03-25)
- [ ] [P1] 채팅 블록 확장 — ThinkingBlock(접기), FileRef(클릭), Citation(출처), ConfirmAction(승인/거부) — 출처: AI 제품 블록 조사 공통 세트 (2026-03-25)
- [ ] [P2] Ops 특화 블록 — CausalChain(인과체인), ServiceMap(서비스 상태), LogViewer(로그 스트리밍). 프로토타입은 /incident에 존재 — 출처: 인시던트 인터페이스 프로토타입 (2026-03-25)
- [ ] [P1] Engine 확장: query/mutation/subscription — command 외 서버 데이터 레이어. Gen UI 채팅 블록이 서버 데이터를 fetch→store 주입하려면 필요. ui/chat 완성 후 착수. 상세: memory/project_engine_query_mutation_sub.md — 출처: 채팅 모듈 discussion (2026-03-27)
- [ ] [P1] Viewer 기능 복원 — ChatFeed 포팅 시 소실: 파일 경로 클릭(splitByFilePaths), loadOlder 무한 스크롤, 타입별 차등 페이싱(usePacedReveal), 타이프라이터 — 출처: docs/0-inbox/60-[retro]chatModule.md (2026-03-27)
- [ ] [P2] 코어 포인터 드래그 primitive — SplitPane.tsx의 startDrag를 engine 레이어로 추출. 두 번째 소비자(Slider/reorder/kanban) 출현 시 실행. 현재 SplitPane.tsx에 경계 분리 완료 — 출처: SplitPane resize discussion (2026-03-28)
- [ ] [P1] form plugin: submit-on-Enter — Aria onActivate에서 dispatch 접근 불가, keyMap plugin으로 해결 필요 — 출처: form plugin retro (2026-03-29)
- [ ] [P2] form plugin: 미들웨어 체인 통합 테스트 — engine 수준에서 rename:confirm 후 __errors__ 자동 갱신 검증 — 출처: form plugin retro (2026-03-29)
- [ ] [P2] Form.tsx 정리 — FormDemo로 대체됨, Aria.Editable 의존은 부적절. 삭제 또는 input 기반 재구현 — 출처: form plugin retro (2026-03-29)
- [ ] [P1] CMS 섹션 추가 실패 — + → 템플릿 선택 후 새 섹션이 사이드바/캔버스에 미표시. Zod 검증 또는 store 동기화 이슈 — 출처: /use power user 탐색 (2026-04-06)
- [ ] [P2] CMS Cmd+↑/↓ 순서 변경 키보드 단축키 확인 — 하단 "위로"/"아래로" 버튼은 있으나 키보드로 작동하는지 미확인 — 출처: /use power user 탐색 (2026-04-06)
- [ ] [P2] CMS 슬라이드 썸네일 클릭 시 패널 간헐적 미갱신 — 재현 조건 불명확, 포커스 경로에 따라 달라질 수 있음 — 출처: /use power user 탐색 (2026-04-06)
- [ ] [P1] LLM-facing Plan 3 — defineData() schema 빌더 (schema/builders/{list,tree,grid,form,...}.ts) — NormalizedData 직접 노출 회피, A2UI Adapter 패턴 재활용 — 출처: PRD docs/2-areas/distribution/prds/llm-facing-3layer-prd.md ② (2026-04-12)
- [ ] [P1] LLM-facing Plan 4 — eject CLI + doctor (scripts/eject.ts, registry.json, dependency-cruiser closure 화이트리스트=ui/items/cells/indicators/panels) — shadcn 모델, 엔진은 npm 잠금 — 출처: 동 PRD ② (2026-04-12)
- [ ] [P1] LLM-facing Plan 6 — evals harness (pyramid-eval/llm-generation/, 30 프롬프트×6범주, axe+키보드 채점, baseline.json, nightly+PR smoke 5개) — Plan 5 aria.md 회귀 보호 — 출처: 동 PRD ② (2026-04-12)
- [ ] [P2] LLM-facing Plan 1.5 — src/pages/ 73 파일 codemod로 단일 entry 마이그레이션 + guardOsPatterns rule 24 차단 승격 — 출처: 동 PRD ⑥#1, Plan 1 후속 (2026-04-12)
- [ ] Progress 바 렌더링 깨짐 — Theme/Components PROGRESS 섹션에서 바 대신 점 4개만 표시됨, \`@os/ui/Progress\` 내부 이슈 의심 — 출처: /internals/theme#components 개선 세션 (2026-04-15)
- [ ] Card Filled variant "선택된 듯" 외형 확인 — 설계 의도인지 버그인지 판단 필요 — 출처: /internals/theme#components 개선 세션 (2026-04-15)
- [ ] worktree 격리 시 untracked 파일 전파 이슈 — Agent tool isolation:worktree 사용 시 main의 untracked 파일이 worktree에 복제되지 않아 import 에러 → 에이전트가 "코드 없음"으로 오인해 삭제하는 실패 발생. SessionStart 훅으로 경고 또는 worktree 생성 시 자동 복사 검토 — 출처: /internals/theme#components 개선 세션 중 실패 모드 (2026-04-15)
- [x] PropertyRow 런타임 height mismatch (52px vs expected 28px) — role:item→composite 재분류로 해결. description 있는 compound item은 28px keyline 대상이 아님 — 출처: /keyline-audit 수렴 루프 (2026-04-16)
- [x] /keyline-audit 스킬을 플러그인 레포(teo-claude-code)에 커밋 — 현재 심볼릭 링크 통해 로컬에만 존재 — 출처: /keyline-audit 구현 세션 (2026-04-16)
- [x] keylineMap designComplete 139/139 전수 판정 완료 — indicator/cell/panel/standalone 일괄 + orchestrator/composite role 기반 분류 — 출처: /keyline-audit 후속 (2026-04-16)
- [ ] \`code-lg\`/\`code-sm\` textStyle 토큰 ax.ts 승격 → CodeViewer presentation preset의 \`font-size: calc(*1.15)\` last-mile 제거 — 출처: code-viewer-prd.md retro G2 (2026-04-17)
- [ ] CodeViewer V9 scrollable tabindex 통합 테스트 (ResizeObserver 모킹) — 출처: code-viewer-prd.md ⑧V9 (2026-04-17)
- [ ] CodeViewer V11 token click 토글 통합 테스트 — 출처: code-viewer-prd.md ⑧V11 (2026-04-17)
- [ ] CodeViewer V16 11곳 사용처 screenshot 회귀 — 출처: code-viewer-prd.md ⑧V16 (2026-04-17)
- [ ] \`keylineMap.json:609\` VirtualCodeBlock 잔재 (자동생성) — 다음 keyline 갱신에서 자연 제거 확인 — 출처: retro G6 (2026-04-17)
- [ ] CodeViewerMagicMove 별도 컴포넌트 discuss/PRD/구현 — shiki-magic-move 래핑, before/after 입력 — 출처: code-viewer-prd.md Non-Goals (2026-04-17)
`,r=e({default:()=>i}),i=`# interactive-os — Architecture Map

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
| search | Integrated | Mod+F 검색, Aria.Search(context) + AriaRemoteSearch(registry) + Aria.SearchHighlight mark. getVisibleNodes 필터. Grid searchable prop. RemoteSearch로 Aria 트리 외부에서 검색 UI 독립 배치 |
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
| FlatLayout (ui/) | Integrated | 배치 엔진(XY+Z). OCP renderer map. Pull 모델. **Widget scroll 독립**: 구조 노드는 FlatLayout이 스크롤, widget은 자체 스크롤 소유. Widget에 .ly-scroll/surface/layout:column 강제 안 함 |

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
| useAria · useAriaZone · useControlledAria | Integrated | onFocusChange 콜백 추가. disabled 옵션. keyMap-only 경로 검증 완료 (CmsLayout Mod+\\\\) |
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
| chat/ (ChatFeed · Composer · TextBlock · CodeBlock · DiffBlock) | Prototype | 블록 렌더러 OCP, agent viewer 포팅 완료. Composer ghost text autocomplete (slash command). 인터랙티브 블록(storeKey) 미실전 검증. **Perf:** MarkdownViewer memo화, 블록 컴포넌트 memo, StreamingTextBlock \`\\n\` pacing + 코드펜스 보류 |
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
| Theme (/internals/theme) | Validated | MiniDemo 그리드 흡수, token 편집기, \`pnpm score:design\` 누락 감지. 6레이어 CSS Layer Architecture 확정. **Pit of Success 불변량 3종**: surface-color 페어링, depth 5단계 레벨, radius-seed 비율 파생 |
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

## Features (auto)

<!-- features:auto -->

_Auto-generated by \`pnpm features\` — 2026-04-17 · 3 features_

| Status | Count |
|--------|-------|
| 🟢 operational | 2 |
| 🟡 prototype | 1 |
| ⬜ concept | 0 |
| ⚪ archived | 0 |

### service

| Feature | Status | Maturity | Tags |
|---------|--------|----------|------|
| [Agent Chat (Gen UI)](1-projects/features/chat-module.md) | 🟡 prototype | 2 | chat, gen-ui, agent-sdk, websocket |
| [Visual CMS](1-projects/features/visual-cms.md) | 🟢 operational | 4 | cms, flatlayout, landing, i18n |

### engine

| Feature | Status | Maturity | Tags |
|---------|--------|----------|------|
| [FlatLayout Engine](1-projects/features/flatlayout-engine.md) | 🟢 operational | 5 | flatlayout, definePage, widget, pull-model |

<!-- /features:auto -->
`;export{t as n,r as t};