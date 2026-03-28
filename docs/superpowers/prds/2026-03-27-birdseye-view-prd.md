# Birdseye View (칸반 조감도) — PRD

> Discussion: 폴더 트리는 세로축만 써서 전체 구조가 안 보인다. 가로+세로를 모두 쓰는 칸반 레이아웃으로 코드 전체를 조망하는 뷰.

## ① 동기

### WHY

- **Impact**: 개발자가 프로젝트 구조를 파악하려면 폴더 트리를 반복적으로 펼치고 접어야 한다. 깊이 3단만 되어도 스크롤이 필요하고, 형제 폴더 간 비교가 불가능하다. "전체를 한눈에" 보는 방법이 없다.
- **Forces**: 폴더 트리는 탐색(drill-down)에 최적화 — 조망(overview)은 구조적으로 불가. 깊이(depth)와 형제(sibling)를 모두 세로축에 매핑하여 두 차원이 충돌한다.
- **Decision**: 가로=폴더(그룹), 세로=파일(항목)의 칸반 레이아웃. NavList로 루트 폴더를 선택하면 하위 구조가 칸반으로 전개된다. 기각: Treemap(파일명 읽기 어려움), Sunburst(면적 기반이라 구조 파악 어려움).
- **Non-Goals**: 파일 편집 기능 (읽기 전용 조망). 파일 내용 미리보기 (구조만). 의존성 그래프 시각화 (별도 기능).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 프로젝트가 로드된 상태 | /birdseye 라우트 진입 | NavList에 2depth 트리 표시 (src/ ▾ interactive-os, pages, styles… / docs/ ▾ …). 첫 2depth 항목 선택, 칸반에 그 하위 구조 전개 | |
| S2 | NavList에 2depth 항목들이 보이는 상태 | src/pages 선택 | 칸반에 cms/, viewer/, birdseye/, chat/, creator/ 컬럼 + flat 파일 카드 | |
| S3 | src/interactive-os 선택된 상태 | 칸반 조망 | 컬럼 = store/, engine/, axis/, pattern/, primitives/, ui/ — 레이어 의존 순서가 가로로 보임 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/pages/viewer/fsClient.ts` | fetchTree, fetchFile, URL 매핑 함수 — PageViewer에서 추출한 SDK 모듈 | |
| `src/pages/viewer/treeTransform.ts` | treeToStore, getAncestorIds, withInitialFileSelected — 트리↔스토어 변환 | |
| `src/pages/birdseye/BirdseyeLayout.tsx` | NavList(좌) + Kanban(우) 2단 레이아웃. useResizer 사용 | |
| `src/pages/birdseye/BirdseyeSidebar.tsx` | 2depth NavList — 루트 직하 폴더(src/, docs/, contents/)를 그룹으로, 그 하위 폴더(src/interactive-os/, src/pages/ 등)를 항목으로. useAriaZone + treeview 패턴 | |
| `src/pages/birdseye/BirdseyeBoard.tsx` | 칸반 영역 — 선택된 폴더의 하위 구조를 컬럼+카드로 렌더링 | |
| `src/pages/birdseye/BirdseyeLayout.module.css` | 레이아웃 스타일 | |
| 라우트 `/birdseye/*` | router.tsx에 추가 | |

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑/↓ | NavList 포커스 중 | 2depth 항목 간 이동 (그룹 내 + 그룹 간) | treeview 패턴 — DFS 순서 네비게이션. src/ 그룹의 마지막 항목에서 ↓ → docs/ 그룹 첫 항목 | 다른 폴더에 포커스, 칸반 영역 교체 | |
| Enter/클릭 | NavList 2depth 항목 포커스 | 해당 폴더 선택 (= 칸반 전개) | activate — 선택이 칸반 데이터 소스 결정. 1depth 그룹 헤더는 선택 불가, 열기/닫기만 | 칸반이 해당 폴더 하위 구조로 갱신 | |
| ←/→ | NavList 1depth 그룹 | 그룹 접기/펼치기 | treeview 패턴 — →로 펼치고 ←로 접기 | 하위 항목 표시/숨김 | |
| ←/→ | 칸반 영역 포커스 중 | 컬럼 간 이동 | 가로 배치된 컬럼이므로 좌우키가 자연스러운 축 | 다른 컬럼의 첫 카드로 포커스 이동 | |
| ↑/↓ | 칸반 카드 포커스 중 | 같은 컬럼 내 카드 간 이동 | 세로 배치된 카드이므로 상하키 | 같은 컬럼의 이전/다음 카드로 이동 | |
| Enter | 칸반 카드(파일) 포커스 | /viewer/{path}로 이동 | 파일 조망→상세 전환. 조감도는 읽기 전용이므로 상세는 Viewer에 위임 | Viewer 라우트로 네비게이트 | |
| Enter | 칸반 카드(폴더) 포커스 | 해당 폴더를 NavList에서 선택 + 칸반 drill-down | 폴더를 열면 그 안을 조망해야 자연스럽다 | NavList 선택 변경 + 칸반 갱신 | |
| Escape | 칸반 영역 포커스 | NavList로 포커스 복귀 | CmsSidebar와 동일 — 하위→상위 탈출 | NavList에 포커스 | |
| Tab | NavList 포커스 | 칸반 영역으로 포커스 이동 | 두 영역 간 탭 이동 — zone 간 전환 | 칸반 첫 컬럼 첫 카드에 포커스 | |
| Cmd+P | 어디서든 | QuickOpen 검색 | 기존 Viewer의 QuickOpen 재사용 | 파일 검색 오버레이 | |
| Home/End | NavList 포커스 | 첫/마지막 폴더로 이동 | listbox 표준 키 | 첫/마지막 폴더에 포커스 | |
| 클릭 | NavList 항목 | 해당 폴더 선택 | 마우스 입력 = 키보드 Enter와 동일 결과 | 칸반 갱신 | |
| 클릭 | 칸반 카드 | 해당 카드 포커스 + 하이라이트 | 마우스로 관심 항목 직접 선택 | 카드 포커스 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 하위 폴더가 0개인 폴더 선택 | 칸반 영역 비어있음 | 파일만 있는 폴더도 유효한 선택 | 단일 컬럼에 파일 카드만 나열 | 칸반에 "(root)" 컬럼 1개 | |
| 하위 폴더가 20+개인 폴더 | 칸반에 컬럼 과다 | 가로 스크롤이 세로 스크롤보다 전체상 파악에 유리 | 가로 스크롤 허용, 컬럼 폭 고정 | 수평 스크롤 가능한 칸반 | |
| 파일이 100+개인 폴더 | 단일 컬럼에 카드 과다 | 조망 목적이므로 모두 보여야 한다 | 세로 스크롤 허용, 카드 높이 최소화 | 컬럼 내 스크롤 | |
| 깊이 3+ 폴더 (하위의 하위) | 칸반에 1단만 표시 | 칸반은 1단 깊이만. 더 깊이 들어가려면 폴더 카드를 Enter로 drill-down | 폴더 카드는 아이콘으로 구분, Enter로 진입 | drill-down 후 칸반 갱신 | |
| 프로젝트 루트 자체 선택 | NavList 최상위 | 루트도 하나의 폴더 | src/, docs/, public/ 등이 컬럼으로 표시 | 프로젝트 전체 조감도 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② 산출물 | 준수 — birdseye/가 독립 라우트 그룹 | — | |
| P2 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② 산출물 | 준수 — fsClient가 데이터를 가져오고, 각 페이지가 자체 store 구성 | — | |
| P3 | UI 완성품만 노출, primitives 노출 금지 (feedback_ui_over_primitives) | ② 산출물 | 준수 — BirdseyeLayout이 완성품 | — | |
| P4 | CSS 모든 수치는 토큰 필수 (feedback_all_values_must_be_tokens) | ② BirdseyeLayout.module.css | 구현 시 준수 필요 | /design-implement 사용 | |
| P5 | gap으로 간격 관리, margin 금지 (feedback_gap_over_margin) | ② CSS | 구현 시 준수 필요 | — | |
| P6 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | ③ NavList | 준수 — CmsSidebar와 동일 패턴 | — | |
| P7 | focus 표현: 컬렉션 항목→bg (feedback_focus_indicator_rule) | ③ 카드/폴더 포커스 | 구현 시 준수 필요 | — | |
| P8 | 가역적 동선 (feedback_reversible_motion) | ③ drill-down | 준수 — Enter로 진입, Escape/뒤로가기로 복귀 | — | |
| P9 | 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ NavList↔칸반 영역 | zone 경계에서 defaultPrevented 확인 필요 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | PageViewer.tsx에서 함수 추출 | import 경로 변경으로 기존 Viewer 동작 깨질 수 있음 | 높 | 추출 후 PageViewer에서 re-import 확인, 테스트 | |
| 2 | router.tsx에 라우트 추가 | 기존 라우트와 충돌 없음 (/birdseye는 미사용 경로) | 낮 | — | |
| 3 | vite-plugin-fs.ts의 /api/fs/tree | 변경 없음 — 기존 API 그대로 소비 | 없음 | — | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | fs 유틸을 interactive-os 레이어에 넣지 않는다 | discuss 결정 — fs는 프로젝트 전용, os는 범용 | 레이어 오염 방지 | |
| 2 | 칸반 뷰에서 파일 편집 기능을 넣지 않는다 | ① Non-Goals | 조망 전용, 편집은 Viewer에 위임 | |
| 3 | PageViewer의 기존 동작을 변경하지 않는다 | ⑥-1 부작용 | 추출만, 리팩터링 아님 | |
| 4 | 트리 깊이를 재귀적으로 모두 펼치지 않는다 | ④ 경계(깊이 3+) | 1단 칸반 + drill-down이 원칙 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | /birdseye 진입 시 NavList + 칸반 렌더링 | 첫 폴더 선택, 하위 구조 컬럼 표시 | |
| V2 | S2 | NavList에서 다른 폴더 선택 | 칸반이 해당 폴더 하위로 교체 | |
| V3 | S3 | 칸반 컬럼 = 하위 폴더, 카드 = 파일 확인 | 폴더명 헤더 + 파일명 카드 | |
| V4 | 경계-하위폴더0 | 파일만 있는 폴더 선택 | 단일 "(root)" 컬럼에 파일 나열 | |
| V5 | 경계-폴더20+ | 하위 폴더 많은 폴더 선택 | 가로 스크롤 가능, 컬럼 폭 유지 | |
| V6 | 경계-깊이3+ | 폴더 카드에서 Enter | drill-down: NavList 선택 변경 + 칸반 갱신 | |
| V7 | ③ Escape | 칸반에서 Escape | NavList로 포커스 복귀 | |
| V8 | ③ Enter(파일) | 파일 카드에서 Enter | /viewer/{path}로 네비게이트 | |
| V9 | ⑥-1 | PageViewer 기존 기능 | 추출 후에도 Viewer 정상 동작 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안 완료, 사용자 확인 필요)
