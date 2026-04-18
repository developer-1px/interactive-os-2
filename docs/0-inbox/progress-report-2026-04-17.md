# Aria Progress Report — 2026-04-17

> 본인 회고용 정식 보고서. 범위: 2025-10-01 ~ 2026-04-17 (약 6.5개월, 1443 커밋).
> 출처: `docs/PROGRESS.md`, `MEMORY.md`, `.claude/CLAUDE.md`, `docs/DESIGN.md`, `git log`, `src/` 디렉토리 스캔.

## 1. Executive Summary

**현 좌표는 "엔진은 거의 다 됐고, 서비스와 콘텐츠가 남았다"이다.** 내부 엔진(store → engine → axis → pattern → primitives → ui)은 Integrated 등급으로 안정화됐고 외부 표면 4개 entry(ui / layout / schema / advanced)로 수렴되어 LLM·npm 청자용 면이 완성 단계에 들어섰다 (커밋 `9b92139b`, `9e401c38`). 반면 서비스 레이어는 숙성도가 극단적으로 비균질하다 — CMS·Viewer·UI Showcase는 Validated~Integrated지만, Chat·Agent Viewer·ComponentCreator는 Prototype에 멈춰 있고 A2UI·Overlay는 Concept/Prototype이다 (PROGRESS.md).

최근 분기의 실질 성장축은 세 갈래:
① **FlatLayout 전환** (Push→Pull, 전 페이지 통일)
② **shadcn/keyline 기반 시각 수렴 루프 착지**
③ **프로세스·스킬 파이프라인 재편** (/story→/ia→/wireframe→/prd→/do, 스킬 34→19 다이어트)

## 2. 레이어별 상태 (Architecture)

| 레이어 | 상태 | 핵심 자산 | 최근 변화 | 다음 갭 |
|---|---|---|---|---|
| store | 🟢 Integrated | NormalizedData, extractSubtree/mergeSubtree, createSingleNodeStore | clipboard·DnD 공용 서브트리 연산 승격 | 직렬화 미구현 (PROGRESS L1) |
| engine | 🟢 Integrated | dispatch+middleware, validator, defineCommand, subscribe | `validator` command 자동검증, `engine.subscribe` (커밋 `4068b169`), core/ 레이어 추출 (`fedc1c5f`) | EffectContext DOM effect, handler registry Phase 2 |
| axis | 🟢 Integrated | 8축(navigate/select/expand/activate/tab/value/dismiss/edit) + commands | `grid 2D cell range selection` (`ba843ad4`), edit 축 분리, core 이관 | triggerPopup ARIA 연결 미완 |
| pattern | 🟢 Integrated | composePattern, 36 APG examples (34/36 소비), form 패턴, menubar | form 패턴 + CMS DetailPanel os화 (`8f216240`) | Carousel 2종 미전환 (의도적 제외) |
| plugins | 🟢 Integrated (15종) | history/crud/clipboard/cellEdit/search/rename/dnd/spatial/urlSync/zodSchema/… | urlSync v2, virtualScroll 훅 이중구조, autoscroll Prototype | form 신/구 병존, permissions = Concept |
| primitives | 🟢 Integrated | useAria, useAriaZone, useControlledAria, Aria.* 7 parts | Aria.Panel/Trigger, useCommand+bindingRegistry, useKeyMap OS 이관 | 10k+ 노드 가상화 = Concept |
| layout | 🟡 Integrated but migrating | FlatLayout(XY+Z), definePage, widgetRegistry, layoutPlugin | Push→Pull 전환 (`7f957930`), 전 페이지 단일 엔진화 (`60dafad9`), Widget scroll 독립 | layoutCommands Prototype, resizer 미구현 |
| overlay | 🟡 Prototype | useOverlay(modal/popup/hint), useAnchorPosition, layerStack | Safari fallback 구현 | 기존 UI 마이그레이션 미시작, Tooltip 통합 미완 |
| ui | 🟢 Integrated (15+ 종) | TreeGrid, ListBox, Kanban, CalendarGrid(신규 composite), SelectionOverlay | AriaComponentProps 통일, shadcn DOM 패리티 2차 (`cb32749f`, `f3ec5559`), chat 블록 Prototype | Select·ContextMenu 미구현, Tooltip 데모 없음 |
| pages — 서비스 라우트 (10종) | 🟢 Validated | CMS/Viewer/UI/Keyline/Theme/Writer/Pipeline/Book/Agent/Chat | 레이어 역의존 차단, os 위반 소급 수렴 | Chat/Agent Phase B·C 백로그 |
| pages — 실험 라우트 (9종) | 🟡 Prototype | Replay/Creator/A2UI/incident/stories/showcase/... | os 위반 21→14 (`e2fba81a`) | 유지/archive 결정 필요 (MEMORY: `feedback_single_page_route_ok`) |

## 3. 서비스별 상태 (Features)

| 서비스 | 경로 | 성숙도 | 최근 변화 | 백로그 |
|---|---|---|---|---|
| **CMS** (visual CMS) | `/` = `pages/cms/PageCms.tsx` | 🟢 Validated | FlatLayout 전환 완료, LLM 친화 접근성(`972895fc`), DetailPanel os화, landing 9섹션 Integrated | paste overwrite, viewer channel, resizer (MEMORY: `project_cms_flatlayout`) |
| **Viewer** (Finder 메타포) | `/viewer` = `PageViewer.tsx` | 🟢 Validated | FilePreview OCP, TreeGrid X-ray, MillerColumns, follow-focus preview, beauty v3 sidebar 0.13 | 사이드바 확장 미완 (handoff 2026-04-15) |
| **UI Showcase** | `/ui` = `PageUiShowcase.tsx` | 🟢 Integrated | 139 demo 카탈로그, keyline 전수 139/139 판정 (`4c7ab936`), /publish 23/23 완전 | visual UI 레이어 품질 편차 (handoff 1b0298e1) |
| **Chat** (Agent SDK) | `/chat` = `PageAgentChat.tsx` | 🟡 Prototype | Composer ghost-text autocomplete, StreamingTextBlock pacing, MarkdownViewer memo | Phase B/C: tool UI, permission (MEMORY: `project_chat_module_gen_ui`) |
| **Agent Viewer** | `/agent` | 🟡 Validated (채널 disabled) | multi-session, virtual scroll, HMR-safe store | viewer channel 백로그 (MEMORY: `project_viewer_channel`) |
| **Replay** (YT Shorts style) | `/pages/replay` | ⬜ Prototype (PROGRESS 미등재) | 코딩 리플레이 뷰어 신규 (`c36dc014`), Skill Kanban v2 (`6862e0dd`) | PROGRESS.md 등재 + 실사용 검증 미완 |
| **Keyline Audit** | `/pages/keyline` | 🟢 Validated | 정적 분석 CLI + inspector overlay, --audit 모드 게이트, designComplete 139/139 | 신규 부품 유입 시 재판정 루프 |
| **Theme Creator** | `/pages/theme` | 🟢 Validated | 6 CSS Layer, Pit of Success 불변량 3종, masonry Components 탭 | (없음) |
| **Writer** (MD 구조 편집) | `/pages/writer` | 🟢 Validated | 9 트리 CRUD, 슬라이드 쇼, 피라미드 뷰 | chat 브릿지 미실전검증 |
| **Component Creator** | `/pages/creator` | 🟡 Prototype | FlatLayout 재작성 (`e883ba6e`) | 미성숙 (MEMORY: `project_component_creator`) |
| **Pipeline Dashboard / Book** | `/pages/pipeline`, `/book` | ⬜ Prototype (PROGRESS 미등재) | FlatLayout Pull 전환 `c7ff06a0`, 칸반 세션 모델 (MEMORY: `project_pipeline_dashboard`, `project_skill_kanban_model`) | PROGRESS.md 등재 필요 |
| **A2UI Surface** | `/pages/a2ui` | 🟡 Prototype (PROGRESS L117) | 15/18 Basic Catalog 매핑 | action 미구현 |

## 4. 디자인 시스템 상태

**결론: ax() 24축은 SSOT로 안착했고 shadcn 패리티가 현재 주 정밀도 갭이다.** DESIGN.md는 Linear 실측 기반 ui/ 완성품 기본값을 확정했고 (`b7fcbc57`), `recipe` 축 도입 → size identity로 축소(`8184e1b0`)로 축 충돌을 제거했다. Keyline audit은 **139/139 전수 판정 게이트**가 CI 수준으로 가동 중(`4c7ab936`, `c2818e2b`). 최근 분기에서 색상·깊이 사다리·토큰 자동파생이 크게 진척됐다 — `surface raised + FlatLayout Z 배치`로 L4 composition 문법 완성(`d796011b`), 토큰 3티어 자동 파생(`367b26bd`), cream→cool white 라이트테마 전환(MEMORY: `project_light_theme_color_direction`). shadcn 패리티 이식 1·2차로 전역 CSS 24개 컴포넌트 DOM/스타일이 개선됐다(`cb32749f`, `f3ec5559`). 남은 갭은 ① 신규 관계 규칙 false positive 튜닝, ② 일부 ui/ CSS 축 위반 6건 잔여(`4b502b7b`), ③ overlay surface 시스템 Prototype 단계.

## 5. 프로세스·스킬 레이어

**결론: 프로세스 레이어가 최근 분기의 최대 성장축이며, "스킬이 곧 제품"의 패턴이 명확해졌다.** 스킬 다이어트로 34→19 수렴(MEMORY: `project_skill_diet`), 기획 파이프라인이 `/discuss → /story → /ia → /wireframe → /prd → /do` 6단 일렬로 재편됐다(MEMORY: `project_planning_pipeline`). `/go`는 phase 자율 선택 오케스트레이터, `/team`은 3역할 편성, `/handoff`는 verify→commit→push→backlog를 원자화한다(MEMORY: `feedback_go_orchestrator`, `project_do_skill`). 커밋 로그 빈도로 본 실사용 톱 스킬은 **handoff / improve-design / keyline-audit / do / publish / archive** 순. 민토 피라미드 계열(`/minto`, `/pyramid`)은 2026-04-12 대개편 후 살아있는 워크플로우로 정착(MEMORY: `project_minto_pipeline_evolution`). Claude Harness는 12 hooks · 29 skills 규모 Validated로 실전 오탐 튜닝이 남은 단계.

## 6. 최근 분기 타임라인 (6개월, 1443 커밋)

커밋 종류 분포: **feat 589 / fix 279 / refactor 261 / docs 140 / chore 73** *(출처: `git log --oneline --since="2025-10-01" | wc -l` = 1443, prefix별 집계)* — feature 중심이지만 fix+refactor=540으로 부채 상환 비중이 상당하다.

주요 마일스톤 (시간 역순):
- **2026-04-17 (today) — CodeBlock 라인넘버 거터 수정** (`c2648a7d`), YT Shorts Replay 뷰어 (`c36dc014`)
- **2026-04-15 — shadcn 패리티 2차** (`f3ec5559`), core/ 레이어 추출 OCP 수렴 (`fedc1c5f`, MEMORY: `feedback_ocp_principles`)
- **2026-04-12 — keyline 139/139 전수 게이트 착지** (`4c7ab936`, `c2818e2b`, MEMORY: `project_keyline_audit_pipeline`)
- **2026-04-초 — Single-Entry 4 barrel 출범** (`9b92139b`, `9e401c38`, `b0ef4906`, `e41aa9fd`, `efd38922`, `ffa9e1eb`) — 외부 표면 144→4 수렴 (PROGRESS.md 아키텍처 섹션)
- **2026-04 — aria.md LLM 시스템 프롬프트** (`81f40256`), 26×88 data→component matrix (`af601961`, MEMORY: `feedback_llm_surface_three_layer`)
- **2026-04 초 — FlatLayout Push→Pull 전환 + 전 페이지 단일 엔진화** (`7f957930`, `60dafad9`, `d68ce99b`, `c7ff06a0`, MEMORY: `feedback_flatlayout_model`, `project_flatlayout_direction`)
- **2026-03 말 — Finder Viewer 완성** (`4cde8631`, `1c9d7458`, `6253a1c5`, MEMORY: `project_viewer_as_landing`)
- **2026-03 중 — Component Catalog 139 demo + 자동 카탈로그 인프라** (`5163a8d5`, MEMORY: `project_component_catalog`)
- **2026-03 — FlatLayout 엔진 첫 등장** (`20ae7aab`, `0becd815`, `f6fe2245`, MEMORY: `project_flat_layout_engine`) — 이후 모든 페이지의 배치 엔진이 됨
- **2026-03 초 — CSS @layer 구조/상태 잠금** (`72f144e5`, MEMORY: `feedback_css_architecture`), 단면 border + shape 타입 금지(`e3d48a00`)
- **2026-02 — ax() recipe 축 도입, shadcn 자유도 원리 적용** (`e3011335`, `57acaedb`, `d5671429`, MEMORY: `project_ax_shadcn_insight`)
- **2025-11~12 — Linear 실측 기반 토큰, Inspector Log 탭, engine.subscribe** (`fe1cdab3`, `78378ec8`, `4068b169`, MEMORY: `project_linear_benchmark`)

## 7. 회고

### 잘 된 것 (증거 3)
1. **외부 표면의 극적 수렴** — npm exports 144 → 4 entry로 접었고(`9e401c38`) LLM 시스템 프롬프트와 정렬했다(`81f40256`). 청자가 두 명(npm 사용자 / LLM)이라는 비전이 실제 코드 경계가 됐다.
2. **FlatLayout이 단일 레이아웃 엔진으로 전환 완료** — Push→Pull 모델 확립 후(`7f957930`) `/ui /chat /replay`를 포함한 전 페이지가 FlatLayout로 통일됐다(`60dafad9`). "XY+Z 배치 소유권" 원칙이 내장화됐다(MEMORY: `feedback_flatlayout_model`).
3. **시각 수렴 루프 인프라화** — keyline audit --audit 게이트 + designComplete 139/139 전수 판정(`4c7ab936`, `c2818e2b`)은 디자인 수준에서 드물게 "루프"가 붙은 사례다. shadcn 패리티 이식 2차와 recipe 축 도입도 같은 계열의 수렴.

### 덜 된 것 (증거 6)
1. **Chat / Agent Viewer Phase B·C 정체** — Chat은 Phase A(텍스트) 이후 tool UI·permission이 Prototype 그대로(PROGRESS App Shell, MEMORY: `project_chat_module_gen_ui`). 엔진은 준비되었으나 서비스 레벨 완결이 안 됐다.
2. **Overlay 시스템 미착지** — types/layerStack/useOverlay/useAnchorPosition 전부 Prototype, "기존 UI 컴포넌트 마이그레이션 미시작"이 PROGRESS에 명시(L5.5). Tooltip 데모조차 없다.
3. **pages 레이어 os 위반 14건 잔존** — 21→14로 줄었지만(`e2fba81a`) 완전 수렴 전이고, ui/ CSS 축 위반 6건, layoutCommands/autoscroll/form(신) Prototype, permissions Concept, 10k+ 노드 가상화 Concept가 모두 미착수다.
4. **메트릭/시각화 컴포넌트 갭** — Chart/Sparkline/Stat/Gauge 등 대시보드 필수 부품이 ui/에 부재 (MEMORY: `project_metric_component_gap`). Pipeline Dashboard·CMS 분석 뷰가 이 갭 때문에 막혀 있다.
5. **Linear 벤치마크 갭 컴포넌트 5개** — Linear 6 페이지 유형 대조에서 5개 부품이 미구현으로 식별됨 (MEMORY: `project_linear_benchmark`). UI Showcase 139 demo가 있어도 실제 앱 조립에는 빈칸이 남는다.
6. **디자인 측정 루프 부재** — keyline audit으로 "수치 수렴"은 생겼지만 사용자 관점의 디자인 품질(읽힘/위계/중복) 측정 루프가 없다 (MEMORY: `feedback_design_convergence_loop`). 측정(A) 없이 루프(B)만 돌리는 구조적 공백.

### 다음 분기 초점
- **서비스 완결**: Chat Phase B(tool UI) → C(permission), Agent viewer channel 활성화, CMS paste overwrite / resizer.
- **Overlay 1급 승격**: Prototype 5종을 Validated로. Tooltip·ContextMenu·Select를 먼저 착지시키면 UI 커버리지 갭이 메워진다.
- **ax() shadcn 패리티 3차 + 관계 규칙 false positive 튜닝** (design-lint 8 rules Validated → Integrated).
- **LLM-facing 3층 모델 실측** — data→component matrix (`af601961`)와 aria.md가 실제 LLM 출력 품질로 회귀하는지 측정 루프 부재. `/use` + `/improve-design`를 LLM 관점에서 돌리는 감사가 필요.
- **pages 실험 라우트 정리** — `incident/stories/showcase/a2ui`의 유지/archive 결정 (MEMORY: `feedback_single_page_route_ok` 기준).

---

*작성: 2026-04-17 / 본인 회고용. 마케팅 톤 제거, 증거 우선.*
