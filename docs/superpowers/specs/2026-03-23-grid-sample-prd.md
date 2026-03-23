# Grid 샘플 보강 — PRD

> Discussion: grid behavior(2D 셀 네비게이션, Aria.Cell)를 만들었지만 샘플이 list 수준. 스프레드시트급 데이터·시각으로 보강.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | grid behavior + Aria.Cell로 2D 셀 네비게이션을 구현했다 | /collection/grid 페이지를 연다 | 4컬럼×5행, 셀 경계 없음 → list처럼 보여서 grid를 만들었다는 사실이 전달 안 됨 | |
| M2 | 스프레드시트급 기능(←→↑↓ 셀 이동, F2 편집, ⌘C/V, ⌘Z)이 있다 | 샘플 데이터가 5행뿐이다 | 2D 탐색의 필요성이 느껴지지 않고, 기능 시연 동기가 없다 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `shared-grid-data.ts` | 컬럼 6~8개 × 행 15~20개 Employee Directory 데이터. 셀 유형 다양성(문자열, 숫자, 이메일, 날짜, 부서) | |
| `PageGridCollection.tsx` | 헤더 컬럼 수 반영 + 셀 border 스타일링으로 스프레드시트 느낌 | |
| `PageGrid.tsx` | 같은 shared-grid-data를 쓰므로 자동 반영. pattern 쪽도 확장된 데이터로 동작 확인 | |
| `components.css` gridcell 스타일 | 셀 경계선 + 포커스 하이라이트 추가 (기존 `[role="gridcell"]` 규칙 보강) | |

완성도: 🟢

## ③ 인터페이스

> 기존 Grid 컴포넌트 + 플러그인의 인터랙션은 변경 없음. 데이터·스타일만 교체.
> 아래는 **샘플이 시연해야 하는 인터랙션 목록** (이미 구현된 것, 샘플로 체감 가능해야 함).

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ←→ | 셀 A에 포커스 | 인접 셀로 이동 | `navigate({grid})` — grid 모드에서 ←→는 col 이동 | 인접 셀에 포커스 + 시각적 하이라이트 | |
| ↑↓ | 셀에 포커스 | 같은 컬럼의 상/하 행으로 이동 | grid 모드에서 ↑↓는 row 이동 | 상/하 행 같은 컬럼 셀에 포커스 | |
| Home/End | 셀에 포커스 | 현재 행의 첫/마지막 셀로 이동 | `grid.focusFirstCol()/focusLastCol()` | 행 내 첫/끝 셀에 포커스 | |
| Mod+Home/End | 셀에 포커스 | 첫/마지막 행으로 이동 | `focusFirst()/focusLast()` | 첫/끝 행에 포커스 | |
| Space | 행에 포커스 | 행 선택 토글 | `select()` 축 | aria-selected 토글 | |
| F2 | 셀에 포커스 | 셀 편집 모드 진입 | `renameCommands.startRename` | 셀이 편집 가능 상태 | |
| Delete | 행에 포커스 | 행 삭제 | `crudCommands.remove` | 행 제거 + focusRecovery | |
| ⌘C / ⌘V | 행 선택 상태 | 행 복사/붙여넣기 | clipboard 플러그인 | 복사된 행 삽입 | |
| ⌘Z | 편집/삭제 후 | undo | history 플러그인 | 이전 상태 복원 | |
| Alt+↑↓ | 행에 포커스 | 행 순서 이동 | dnd 플러그인 `moveUp/Down` | 행 위치 교환 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 첫 행 첫 셀에서 ← | (0,0) 포커스 | 경계 밖 이동 불가 | 아무 일 없음 (유지) | 포커스 유지 | |
| 마지막 행 마지막 셀에서 → | (N,M) 포커스 | 경계 밖 이동 불가 | 아무 일 없음 | 포커스 유지 | |
| 모든 행 삭제 후 | 빈 grid | focusRecovery — 삭제 후 포커스 대상이 없음 | 빈 상태로 유지, 포커스 컨테이너로 복귀 | 빈 grid 표시 | |
| 컬럼 수 변경 시 Grid behavior | columns 파라미터 변경 | `gridBehavior({ columns })` useMemo 의존성 | columns.length 변경 시 behavior 재생성 | 새 컬럼 수로 네비게이션 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② shared-grid-data.ts | ✅ 미위반 — 모듈명 camelCase 멀티 export | — | |
| P2 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 컬럼 key 이름 | ✅ 미위반 — 도메인 데이터, ARIA 용어 아님 | — | |
| P3 | 테스트 원칙: 계산은 unit, 인터랙션은 통합 (CLAUDE.md) | ⑧ 검증 | ✅ 미위반 — 기존 integration test 유지 | — | |
| P4 | never barrel export (CLAUDE.md) | ② 산출물 | ✅ 미위반 — 기존 구조 유지 | — | |
| P5 | focusRecovery 불변 조건 (feedback_focus_recovery_invariant) | ④ 모든 행 삭제 | ✅ 미위반 — focusRecovery 플러그인 이미 적용 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `shared-grid-data.ts` — PageGrid(pattern)도 import | 컬럼 수 증가로 pattern 쪽 헤더 렌더링도 변경됨 | 낮 | 허용 — pattern 쪽도 더 풍부한 데이터로 이득 | |
| S2 | `components.css` gridcell 스타일 | 다른 grid 사용처(cms-i18n-sheet)에 영향 가능 | 중 | cms-i18n-sheet는 자체 `.cms-i18n-sheet__grid [role="gridcell"]` 스타일로 오버라이드 중 → 영향 없음 | |
| S3 | 기존 grid integration test | 테스트가 `shared-grid-data`를 직접 import하지 않음 (자체 fixture 사용) | 낮 | 영향 없음 확인됨 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | Grid 컴포넌트(Grid.tsx) 구조 변경 | 범위 밖 | 데이터+스타일 교체만, 컴포넌트 로직은 건드리지 않음 | |
| X2 | Aria.Cell / navigate 축 수정 | 범위 밖 | 엔진 레이어 변경 불가 | |
| X3 | cms-i18n-sheet gridcell 스타일 깨뜨리기 | ⑥ S2 | 범용 `[role="gridcell"]` 스타일 변경 시 cms 전용 스타일과 충돌 가능 → 선택자 범위 한정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | /collection/grid 열기 | 셀 경계가 보이는 스프레드시트 형태, 6~8컬럼 × 15~20행 | |
| V2 | ③ ←→ | 셀에서 ←→ 누르기 | 인접 셀로 포커스 이동 + 시각적 하이라이트 | |
| V3 | ③ ↑↓ | 셀에서 ↑↓ 누르기 | 같은 컬럼 상/하 행으로 이동 | |
| V4 | ③ F2 | 셀에서 F2 | 셀 편집 모드 진입 | |
| V5 | ③ ⌘C/V | 행 선택 후 ⌘C, 다른 위치에서 ⌘V | 행 복사 삽입 | |
| V6 | ③ ⌘Z | 삭제 후 ⌘Z | 삭제 취소, 행 복원 | |
| V7 | ④ 경계 | 첫 셀에서 ←, 마지막 셀에서 → | 포커스 유지, 아무 일 없음 | |
| V8 | ⑥ S1 | /pattern/grid 열기 | 확장된 데이터로 정상 표시 | |
| V9 | ⑥ S2 | CMS i18n 시트 grid 확인 | 기존 스타일 유지 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
