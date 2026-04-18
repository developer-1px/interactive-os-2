---
id: 2-areas/axis/prds/selection-overlay-prd
title: 'SelectionOverlay — PRD'
created: 2026-03-31
updated: 2026-04-08
summary: 'Discussion: 포커스/선택 표현을 콘텐츠에서 분리하여 독립 overlay로 전환. 범용 selection 도구.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, data-node-id, nodeidattr]
  relates: []
  supersedes: []
---
# SelectionOverlay — PRD

> Discussion: 포커스/선택 표현을 콘텐츠에서 분리하여 독립 overlay로 전환. 범용 selection 도구.

## ① 동기

### WHY

- **Impact**: CMS 타입 추가마다 12개+ Focused CSS 쌍을 관리해야 함. 콘텐츠 렌더러에 편집 상태가 결합되어 "디자인 변경 불가" 원칙 위반. 다른 라우트에서 selection 도구 재사용 불가.
- **Forces**: os 기반 개발 원칙(ui/ 완성품만) vs 현재 CMS 날코딩 패턴. rAF 정확성 요구 vs 성능 비용.
- **Decision**: 콘텐츠 DOM 위에 독립 overlay 레이어를 띄워 selection 표현. ResizeObserver+scroll 방식은 프레임 밀림 가능성으로 기각. CSS outline 방식(현행)은 콘텐츠 결합 해소 불가로 기각.
- **Non-Goals**: 콘텐츠 DOM 수정. 드래그 선택(marquee). 리사이즈 핸들.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | overlay가 있는 화면 | 노드에 포커스 이동 | 해당 노드의 bounding rect에 셀렉션 사각형 표시 + 타입/크기 라벨 | ✅ useRectTracker::trackElement + SelectionOverlay 렌더 |
| M2 | 포커스된 노드가 있는 상태 | 스크롤 발생 | overlay가 프레임 밀림 없이 정확히 추적 | ✅ rAF 루프 매 프레임 getBoundingClientRect |
| M3 | overlay가 있는 화면 | 마우스가 노드 위로 호버 | 연한 호버 사각형 프리뷰 표시 | ✅ mousemove → closest → hoveredIdRef |
| M4 | 호버 overlay | 마우스가 노드 밖으로 이탈 | 호버 사각형 즉시 제거 | ✅ mouseleave → hoveredIdRef=null |
| M5 | 멀티셀렉션 상태 | 여러 노드 선택 | 각 노드에 개별 셀렉션 사각형 | ✅ selectedIds 순회 + trackElement |
| M6 | CMS 캔버스 | spatial nav으로 깊이 전환 | overlay가 새 깊이의 포커스 노드를 즉시 추적 | ✅ focusedIdRef.current 변경 → 동일 메커니즘 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/SelectionOverlay.tsx` | ui/ 완성품. overlay 컨테이너 + rect 사각형 + 라벨 렌더링 | ✅ `SelectionOverlay.tsx::SelectionOverlay` |
| `ui/SelectionOverlay.module.css` | 셀렉션/호버 색상, 라벨 스타일, pointer-events:none | ✅ `SelectionOverlay.module.css` |
| `ui/useRectTracker.ts` | rAF 루프로 대상 DOM 노드들의 bounding rect 추적 hook | ✅ `useRectTracker.ts::useRectTracker` |

**구조 관계:**
- `useRectTracker` — focusedId/selectedIds/hoveredId + containerRef → rAF로 rect[] 계산
- `SelectionOverlay` — useRectTracker 소비 → 사각형 + 라벨 렌더
- 소비자는 `<SelectionOverlay containerRef={ref} focusedId={...} selectedIds={...} />` 하나만 배치
- 호버: SelectionOverlay가 containerRef에 mousemove 리스너 등록, `e.target.closest('[data-node-id]')`로 자체 추출
- `nodeIdAttr` prop으로 셀렉터 커스텀 가능 (CMS: `data-cms-id`)

완성도: 🟢

## ③ 인터페이스

> overlay는 표시 전용(pointer-events:none). 키보드/클릭 인터랙션은 기존 engine이 처리, overlay는 결과 상태만 구독.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| focusedId 변경 | 이전 노드에 셀렉션 rect | rAF에서 새 노드 getBoundingClientRect | overlay는 engine 상태의 시각 투영, focusedId가 SSOT | 새 노드에 셀렉션 rect + 라벨 | ✅ 일치 |
| selectedIds 변경 | 단일/멀티 셀렉션 | 각 ID의 rect 계산 | 멀티셀렉션은 각각 독립 rect, 겹침 허용 | 모든 선택 노드에 셀렉션 rect | ✅ 일치 |
| 마우스 이동 | 호버 없음 | closest(`[nodeIdAttr]`)로 호버 대상 탐색 | 콘텐츠 DOM에서 이벤트 수신, overlay는 결과만 표시 | 호버 대상에 연한 rect 프리뷰 | ✅ 일치 |
| 마우스 이탈 | 호버 중 | hoveredId → null | 컨테이너 밖 = 대상 없음 | 호버 rect 제거 | ✅ 일치 |
| 스크롤 | rect 표시 중 | rAF가 매 프레임 rect 재계산 | 스크롤은 layout 변경, rAF+getBoundingClientRect로 최신 좌표 보장 | rect가 노드를 정확히 추적 | ✅ 일치 |
| 깊이 전환 | 이전 깊이 rect | focusedId 변경 → 동일 메커니즘 | spatial nav이 focusedId를 변경하면 overlay도 반응 | 새 깊이 노드에 rect | ✅ 일치 |
| focusedId null/빈 | rect 표시 중 | 셀렉션 rect 제거 | 대상 없으면 표시 없음 | 빈 overlay | ✅ 일치 |
| 대상 노드 display:none | focusedId 유효 | rect → 0,0,0,0 | 보이지 않는 노드에 rect 무의미 | rect 미표시 (w/h 0 가드) | ✅ 일치 |

**키보드/클릭**: 모두 N/A — overlay는 표시 전용, 인터랙션은 engine/pattern이 처리.

**라벨**: `labelFn?: (id: string, rect: DOMRect) => string` 콜백으로 소비자가 주입. 범용.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| B1: focusedId가 DOM에 없는 ID | overlay 표시 중 | querySelector null → rect 계산 불가 | rect 미표시, 에러 없음 | 빈 overlay | ✅ trackElement early return |
| B2: 컨테이너 비가시(탭 전환) | rAF 실행 중 | 브라우저가 비가시 탭의 rAF 자동 정지 | rAF 자동 정지, 재가시 시 재개 | 성능 보존 | ✅ 브라우저 내장 |
| B3: 대상 노드 매우 작음(1×1) | 포커스 이동 | 라벨은 정보 도구, 노드 크기와 무관 | rect 그대로, 라벨은 상단 외부 배치 | 라벨 넘침 허용 | ✅ label bottom:100% |
| B4: 노드가 컨테이너 밖 clipped | 스크롤로 부분 노출 | overlay가 콘텐츠와 동일하게 잘려야 자연스러움 | overlay 컨테이너 동일 overflow 영역 → 자연 clip | 부분 rect | ✅ overlay overflow:hidden |
| B5: 호버와 포커스 같은 노드 | 포커스 rect + 호버 | 동일 노드 이중 표시는 시각 노이즈, 포커스가 강한 상태 | 포커스 rect만, 호버 억제 | 포커스 유지 | ✅ hovered !== focused 가드 |
| B6: 컨테이너 리사이즈 | rect 표시 중 | rAF가 매 프레임 재계산하므로 자동 대응 | 추가 처리 없이 자동 추적 | rect 갱신 | ✅ rAF 매 프레임 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | os 기반 개발 — ui/ 완성품만 (CLAUDE.md) | ② | ✅ 준수 | — | ✅ 일치 |
| P2 | 디자인 변경 불가 = CMS 핵심 가치 (memory) | ① | ✅ overlay 분리가 실현 | — | ✅ 일치 |
| P3 | CSS 모든 수치는 토큰 필수 (memory) | ② CSS | ✅ 준수 | — | ✅ 일치 |
| P4 | module.css 3블록 base→variant→size (memory) | ② CSS | ✅ 준수 | — | ✅ 일치 |
| P5 | 테스트 userInput 중심, 구조 assert 금지 (memory) | ⑧ | ✅ 준수 | — | ✅ 일치 |
| P6 | 콘텐츠 DOM 무수정 (④ 제약) | ③ | ✅ data-node-id는 useAriaView 자동 주입 | — | ✅ 일치 |
| P7 | 포커스: 컬렉션→bg, 독립→ring (memory) | ③ | 🔀 범위 밖 — overlay는 편집 도구 표현 | — | ✅ 일치 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | cms-renderers.tsx getNodeClassName() Focused 클래스 | 기존 포커스 시각 표현 사라짐 | 높 | overlay 완전 대체 확인 후 원자적 제거 | ✅ 원자적 교체 |
| S2 | CmsLanding.module.css 12개 *Focused 클래스 | dead CSS 제거 | 낮 | S1과 동시 제거 | ✅ 동시 제거 |
| S3 | rAF 상시 루프 추가 | CMS에서 상시 CPU | 중 | 허용 — 프레임 밀림 불가 제약 우선. 비가시 탭 자동 정지 | ✅ rectsEqual 추가로 완화 |
| S4 | mousemove 리스너 추가 | closest() DOM 탐색 | 낮 | 허용 — depth 얕음 | ✅ 일치 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 콘텐츠 DOM에 overlay용 속성/클래스 추가 | ⑤P6 | data-node-id는 useAriaView 자동 주입만 사용 | ✅ 준수 |
| X2 | overlay에 pointer-events 활성화 | ⑥S4 | engine 인터랙션 파괴 | ✅ pointer-events:none |
| X3 | Focused CSS 점진적 제거 | ⑥S1 | 이중 표시/누락. 원자적 교체만 | ✅ 원자적 교체 |
| X4 | ResizeObserver/scroll로 rect 추적 | discuss 제약 | 프레임 밀림 가능성. rAF만 | ✅ rAF만 사용 |
| X5 | overlay에서 engine dispatch | ⑤P1 | 읽기 전용 시각 투영 | ✅ dispatch 경로 없음 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | 포커스 이동 → overlay DOM 확인 | 대상 노드 위치에 셀렉션 rect + 라벨 텍스트 | 🔀 jsdom 0x0 제약으로 구조 검증만 `selection-overlay.screen.test.tsx::renders overlay container` |
| V2 | ①M2 | 포커스 후 컨테이너 스크롤 | rect가 노드 getBoundingClientRect와 매 프레임 일치 | ❌ jsdom에서 검증 불가 — 브라우저 테스트 필요 |
| V3 | ①M3 | 마우스를 노드 위로 이동 | 호버 rect 표시 (포커스와 다른 스타일) | ❌ jsdom에서 검증 불가 |
| V4 | ①M4 | 마우스를 컨테이너 밖으로 이동 | 호버 rect 제거 | ❌ jsdom에서 검증 불가 |
| V5 | ①M5 | 멀티셀렉션 진입 | 선택 노드 수만큼 rect | ❌ jsdom에서 검증 불가 |
| V6 | ①M6 | spatial nav 깊이 진입 | 새 깊이 포커스 노드에 rect | ❌ jsdom에서 검증 불가 |
| V7 | ④B1 | DOM에 없는 ID로 focusedId | rect 미표시, 에러 없음 | ❌ jsdom에서 검증 불가 |
| V8 | ④B5 | 호버 노드에 포커스 이동 | 포커스 rect만, 호버 억제 | ❌ jsdom에서 검증 불가 |
| V9 | ⑥S1 | overlay 적용 후 CMS 탐색 | *Focused CSS 클래스 DOM에 없음 | ✅ `selection-overlay.screen.test.tsx::has no *Focused CSS classes` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/axis
