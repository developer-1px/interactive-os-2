# Panel Resizer — PRD

> Discussion: CMS 3패널 + Agent Viewer 다중 컬럼 레이아웃에 드래그+키보드 resizer 추가. engine 밖 독립 hook으로 구현.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS에서 Sidebar(120px) + Canvas + DetailPanel(240px) 3패널 레이아웃 사용 중 | 사이드바/디테일패널 폭이 작업에 안 맞을 때 | 패널 경계를 드래그하여 원하는 폭으로 조절할 수 있어야 한다 | |
| M2 | Agent Viewer에서 Sessions(200px) + N개 TimelineColumn 가로 나열 | Sessions↔첫 컬럼, 컬럼↔컬럼 등 모든 패널 경계의 폭을 조절하고 싶을 때 | 동일한 resizer로 각 패널 폭을 개별 조절할 수 있어야 한다 | |
| M3 | 키보드로 앱을 조작하는 사용자 | 패널 경계(separator)에 포커스하고 Arrow 키를 누를 때 | 패널 폭이 step 단위로 조절되어야 한다 (APG Window Splitter) | |
| M4 | 패널 폭을 조절한 뒤 페이지를 새로고침 | — | 조절한 폭이 유지되어야 한다 (localStorage) | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useResizer` hook | 하나의 separator 경계를 관리. pointer events + keyboard → 왼쪽 패널의 폭(px) 반환. `{ separatorProps, size }` | `useResizer.ts::useResizer` |
| 호출 패턴 | CMS: `useResizer` × 2 (sidebar, detail). Agent: `useResizer` × N (동적). 각 호출이 독립적 | `CmsLayout.tsx`, `PageAgentViewer.tsx`, `PageViewer.tsx` |
| `separatorProps` | `role="separator"`, `aria-valuenow/min/max`, `tabIndex={0}`, pointer/keyboard handlers를 spread할 props 객체 | `useResizer.ts::useResizer` (반환값) |
| hook 옵션 | `{ defaultSize, minSize, maxSize, direction, step, storageKey }` | `useResizer.ts::UseResizerOptions` |
| CSS | `.resizer-handle` — 공용 스타일. 4px 폭, hover 시 accent 색상, `cursor: col-resize` | `resizer.css::.resizer-handle` |

완성도: 🟢

## ③ 인터페이스

> 산출물이 가로 배치 — 좌우 키 필수, 상하 키 N/A

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| pointerdown on separator | 패널 폭 = currentSize | pointermove → deltaX 계산 → 새 폭 = clamp(current + delta, min, max) | 드래그는 연속 값 조작의 가장 직관적인 입력 | 패널 폭 = 새 값, aria-valuenow 갱신 | |
| pointerup | 드래그 중 | 드래그 종료, localStorage에 저장 | 드래그 중 매번 저장하면 I/O 낭비 | 폭 확정, persist 완료 | |
| ← (ArrowLeft) | separator에 포커스, 수평 방향 | 왼쪽 패널 폭 -= step | APG Window Splitter: 좌 = 축소 | 패널 폭 -= step, persist | |
| → (ArrowRight) | separator에 포커스, 수평 방향 | 왼쪽 패널 폭 += step | APG Window Splitter: 우 = 확대 | 패널 폭 += step, persist | |
| Home | separator에 포커스 | 왼쪽 패널 폭 = minSize | APG: Home = 최소값 | 패널 폭 = min, persist | |
| End | separator에 포커스 | 왼쪽 패널 폭 = maxSize | APG: End = 최대값 | 패널 폭 = max, persist | |
| ↑ (ArrowUp) | separator에 포커스, 수평 방향 | N/A | 수평 분할에서 상하 키는 의미 없음 | 변화 없음 | |
| ↓ (ArrowDown) | separator에 포커스, 수평 방향 | N/A | 수평 분할에서 상하 키는 의미 없음 | 변화 없음 | |
| Enter | separator에 포커스 | N/A | separator는 값 조절만, 활성화 행동 없음 | 변화 없음 | |
| Escape | separator에 포커스 | N/A | 드래그 취소는 pointerup으로 충분 | 변화 없음 | |
| Space | separator에 포커스 | N/A | separator는 토글 대상이 아님 | 변화 없음 | |
| Tab | 다른 곳에 포커스 | separator로 포커스 이동 | tabIndex={0}이므로 탭 순서에 포함 | separator 포커스 | |
| 클릭 (single) | — | separator에 포커스 | focusable 요소의 기본 동작 | separator 포커스 | |
| 더블클릭 | separator에 포커스 | 폭을 defaultSize로 리셋 | 관례: 더블클릭 = 기본값 복원 (?) | 패널 폭 = default, persist | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1. 드래그로 min 이하로 축소 | 폭 = minSize 근처 | 패널이 0px이면 콘텐츠 소실, 레이아웃 깨짐 | clamp(minSize)에서 멈춤 | 폭 = minSize | |
| E2. 드래그로 max 초과 확대 | 폭 = maxSize 근처 | 인접 패널이 너무 좁아짐 | clamp(maxSize)에서 멈춤 | 폭 = maxSize | |
| E3. 브라우저 창 리사이즈로 패널이 공간 초과 | 폭 > 사용 가능 공간 | 레이아웃 overflow 방지 | flex 레이아웃이 자연스럽게 축소 (flex-shrink), 저장 값은 유지 | 시각적 축소, 저장 값 불변 | |
| E4. localStorage에 저장된 값이 현재 min/max 범위 밖 | 저장값 존재 | 레이아웃 변경 후 이전 값이 유효하지 않을 수 있음 | clamp(min, stored, max)로 보정 | 보정된 값 사용 | |
| E5. Agent Viewer에서 컬럼 추가/제거 | N개 컬럼 | 동적 패널 수 변경 시 resizer도 동적 | 컬럼 수에 맞게 resizer 생성/소멸, 각 폭 독립 persist | N±1 resizer | |
| E6. 모바일 뷰포트 (≤600px) | CMS sidebar display:none | 숨겨진 패널의 resizer가 보이면 안 됨 | sidebar가 숨겨지면 해당 resizer도 숨김 | resizer 비표시 | |
| E7. step 이동이 min/max를 넘을 때 | 폭 = minSize + step/2 | Arrow 한번에 min 아래로 가면 안 됨 | clamp 적용. min/max에 도달하면 더 이동 안 함 | 폭 = min 또는 max | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 키보드 우선 (user profile) | ③ 인터페이스 | ✅ 준수 — Arrow/Home/End 키보드 지원 | — | |
| P2 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 준수 — `useResizer.ts` → `export function useResizer` | — | |
| P3 | 테스트: 인터랙션 = 통합, mock 검증 금지 (CLAUDE.md) | ⑧ 검증 | ✅ 준수 — pointer/keyboard → DOM 상태 검증 | — | |
| P4 | engine 우회 금지 (feedback_design_over_request) | ② 산출물 | ✅ 해당 없음 — resizer는 UI 상태, engine 데이터 아님 | — | |
| P5 | focusRecovery 불변 조건 (feedback_focus_recovery_invariant) | ③ 인터페이스 | ✅ 해당 없음 — separator는 CRUD 없음, 포커스 소실 없음 | — | |
| P6 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 산출물 | 🟡 검토 — hook 이름 `useResizer` vs APG 용어 `separator` | `useResizer`는 사용 맥락 기준 이름이라 허용. `separatorProps`로 ARIA 용어 사용 | |
| P7 | 가역적 동선 (feedback_reversible_motion) | ③ 인터페이스 | ✅ 준수 — ← 이동 후 → 로 복귀, 더블클릭 리셋 | — | |
| P8 | barrel export 금지 (CLAUDE.md) | ② 산출물 | ✅ 준수 — 직접 import | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `cms.css` — `.cms-sidebar`, `.cms-detail-panel` 폭 | 고정 `width` → 동적 `width`(CSS variable 또는 inline style)로 변경 | 중 | 기존 고정 width를 defaultSize로 유지, resizer가 override | |
| S2 | `cms.css` — `.cms-body` flex 레이아웃 | separator div 추가로 flex children 변경 | 낮 | separator는 flex-shrink:0, 4px 폭 — 레이아웃 영향 미미 | |
| S3 | `CmsLayout.tsx` | separator 요소 삽입 + 폭 state 추가 | 낮 | hook이 상태 관리, 레이아웃에는 spread만 | |
| S4 | `PageAgentViewer.tsx` — 컬럼 렌더링 | 컬럼 간 separator 삽입, 각 컬럼 폭 개별 관리 | 중 | 기존 columnOrder 로직은 유지, 폭만 추가 | |
| S5 | 드래그 중 Canvas/Timeline 리렌더 | pointermove마다 state 갱신 시 하위 트리 리렌더 | 중 | CSS variable로 폭 제어 시 React 리렌더 없이 처리 가능. 또는 rAF 쓰로틀 | |
| S6 | `@media (max-width: 600px)` sidebar 숨김 | sidebar resizer가 숨겨진 상태에서 남아있을 수 있음 | 낮 | sidebar와 동일한 미디어쿼리로 resizer도 숨김 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | engine store에 패널 폭 저장 | ⑤P4 | 패널 폭은 UI 상태, 도메인 데이터 아님. engine은 CRUD 데이터 전용 | |
| F2 | 드래그 중 매 pointermove마다 React setState | ⑥S5 | 리렌더 폭주. CSS variable 또는 ref로 DOM 직접 조작 | |
| F3 | 테스트에서 mock 호출 검증 | ⑤P3 | pointer/keyboard 이벤트 → DOM 결과(폭, aria-valuenow)로 검증 | |
| F4 | separator에 시각적 콘텐츠 (아이콘, 텍스트) 배치 | — | separator는 4px 핸들, 시각적 방해 최소화 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | CMS에서 sidebar↔canvas separator를 pointerdown→pointermove(+100px)→pointerup | sidebar 폭 = 220px (120+100), aria-valuenow = 220 | `useResizer.test.tsx::"updates size on pointer drag"` |
| V2 | ①M2 | Agent Viewer에서 컬럼 A↔B separator를 드래그 | 컬럼 A 폭 변경, 컬럼 B는 나머지 공간 차지 | `useResizer.test.tsx::"updates size on pointer drag"` (동일 hook) |
| V3 | ①M3 | separator에 포커스 후 ArrowRight 3회 (step=10) | 패널 폭 += 30px, aria-valuenow 갱신 | `useResizer.test.tsx::"ArrowRight increases size by step"` |
| V4 | ①M3 | separator에 포커스 후 Home | 패널 폭 = minSize | `useResizer.test.tsx::"Home sets minSize"` |
| V5 | ①M4 | 패널 폭 조절 후 새로고침 | localStorage에서 복원, 이전 폭 유지 | `useResizer.test.tsx::"restores size from localStorage on mount"` |
| V6 | ④E1 | 드래그로 minSize 이하로 축소 시도 | minSize에서 clamp, 더 이상 줄지 않음 | `useResizer.test.tsx::"clamps to minSize"` |
| V7 | ④E5 | Agent Viewer에서 컬럼 추가 후 | 새 컬럼 경계에 resizer 자동 생성 | ❌ 테스트 없음 (통합 레벨) |
| V8 | ④E6 | 뷰포트 ≤ 600px | sidebar resizer 비표시 | ❌ 테스트 없음 (CSS 미디어쿼리) |
| V9 | ④E7 | ArrowLeft로 현재 폭이 minSize + step/2일 때 | 폭 = minSize (clamp), 더 축소 안 됨 | `useResizer.test.tsx::"clamps stored value to min/max range"` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
