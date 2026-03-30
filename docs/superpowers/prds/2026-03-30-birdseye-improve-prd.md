# PRD: Birdseye Improve — 3 Features

> 출처: /improve iter-5 (`improve-workspace/iteration-5/eval-birdseye/with_skill/outputs/improve-report.md`)

## ⓪ 동기

birdseye가 "아키텍처 조망 도구"를 표방하지만, 실제 구현은 파일시스템을 칸반으로 시각화하는 것에 머물러 있다. 의존 순서, 파일 크기 비례, 탐색 동선이 코드에서 자동 도출되지 않고 사용자의 머릿속에만 존재한다.

## ① 인터페이스 (사용자가 보는 것)

### F1: Topological Column Ordering

```
Before: 컬럼이 알파벳순 (axis → engine → pattern → primitives → store → ui)
After:  컬럼이 의존순서 (store → engine → axis → pattern → primitives → ui)
        좌→우 = 기반→소비. 역방향 의존이 "오른쪽→왼쪽" 하이라이트로 자동 드러남
```

- `_meta.yaml`이 있으면 수동 순서 우선
- 없으면 **import 그래프에서 폴더 간 의존 방향을 집계 → 위상 정렬로 자동 계산**
- 보편성: import 문이 있는 모든 프로젝트에서 작동

### F2: Treemap Zoom-Out Mode

```
Before: 카드가 균일 크기로 나열. 컬럼 많으면 가로 스크롤 필수. "birdseye인데 새의 눈으로 못 봄"
After:  토글로 treemap 모드 전환. 카드가 LOC 비례 블록. 폴더 전체가 한 화면에.
        블록 클릭 → 해당 카드로 줌인(포커스)
```

- 보드 헤더에 토글 버튼 (kanban / treemap)
- treemap은 squarified 알고리즘 (가로세로 비율 최적화)
- 보편성: (이름, 크기) 쌍이면 작동

### F3: QuickOpen-to-Kanban Bridge

```
Before: QuickOpen에서 파일 선택 → 코드만 오버레이에 뜸. 칸반 미연동.
After:  QuickOpen에서 파일 선택 → 해당 폴더로 칸반 이동 + 카드 포커스 + 의존성 하이라이트
```

### 부수: 히스토리 push + hub 카드 강조

- `selectFolder`의 `{ replace: true }` → 제거. 브라우저 뒤로가기로 폴더 복귀
- hub 카드(importedBy ≥ 20) 시각 강조 강화

## ② 산출물

| # | 파일 | export | 설명 |
|---|------|--------|------|
| 1 | `birdseyeTransform.ts` | `topoSortDirs` | depCounts에서 폴더 간 의존 집계 → 위상 정렬 |
| 2 | `birdseyeTransform.ts` | `buildKanbanStore` 수정 | columnOrder 없을 때 topoSortDirs fallback |
| 3 | `BirdseyeLayout.tsx` | — | F1 통합: depCounts 기반 자동 순서 전달 |
| 4 | `Treemap.tsx` (신규) | `Treemap` | LOC 비례 블록 시각화 컴포넌트 |
| 5 | `Treemap.module.css` (신규) | — | treemap 스타일 |
| 6 | `BirdseyeLayout.tsx` | — | F2 통합: treemap 토글 + F3 QuickOpen 브릿지 |
| 7 | `BirdseyeLayout.tsx` | — | 부수: replace→push, hub 강조 |

## ③ 경계

### In Scope
- F1: 클라이언트 사이드 위상 정렬 (기존 depCounts 데이터 활용)
- F2: `src/interactive-os/ui/Treemap.tsx` UI 완성품으로 제작
- F3: handleQuickOpenSelect 수정
- 부수 2건

### Out of Scope
- 서버 API 변경 (기존 depCounts + imports API로 충분)
- Treemap에서의 의존 하이라이트 (칸반 모드에서만)
- 시계열 데이터 (git history 연동은 별도 PRD)

## ④ 원칙 대조

| 규칙 | 준수 방법 |
|------|----------|
| os 기반 개발 | Treemap을 ui/ 완성품으로 제작, pages에서 import |
| KeyMap 선언 | treemap 모드 토글 키바인딩은 KeyMap으로 |
| CSS 토큰 필수 | /design-implement 스킬로 CSS 작성 |
| 하나의 앱 = 하나의 store | 기존 kanbanStore 재사용, treemap은 같은 데이터의 다른 뷰 |

## ⑤ 부작용

- F1: `_meta.yaml` 순서와 위상 정렬 순서가 충돌할 수 있음 → _meta.yaml 우선 정책
- F2: Treemap 컴포넌트가 ui/에 추가됨 → 다른 곳에서도 재사용 가능해야 함
- F3: QuickOpen 선택 시 폴더 전환이 일어나므로 현재 칸반 컨텍스트를 잃음 → 히스토리 push로 복귀 가능

## ⑥ 금지

- `_meta.yaml`이나 CLAUDE.md에서 레이어 순서를 하드코딩하지 않는다. import 그래프에서 자동 도출
- Treemap에서 카드 편집/CRUD 지원하지 않는다. 읽기 전용 뷰
- addEventListener 직접 사용 금지 (기존 QuickOpen의 Cmd+P도 정리 대상이지만 이번 scope 밖)

## ⑦ 의존 체인

```
F1(topoSort) → F2(treemap도 같은 컬럼 순서 사용) → F3(독립)
부수(독립)
```

F1이 먼저, F2는 F1 완료 후, F3과 부수는 독립.

## ⑧ 검증

| # | 검증 | 방법 |
|---|------|------|
| V1 | _meta.yaml 없는 폴더에서 컬럼이 의존 순서로 정렬 | interactive-os/ 선택 시 store→engine→...→ui 순서 확인 |
| V2 | _meta.yaml 있는 폴더는 수동 순서 우선 | pattern/ 선택 시 _meta.yaml order 유지 |
| V3 | treemap 토글 시 LOC 비례 블록 표시 | 가장 큰 파일 = 가장 큰 블록 |
| V4 | treemap에서 블록 클릭 → 칸반 모드로 전환 + 카드 포커스 | 클릭 후 오버레이 표시 확인 |
| V5 | QuickOpen → 칸반 연동 | 다른 폴더 파일 선택 시 폴더 이동 + 카드 포커스 + dep 하이라이트 |
| V6 | 브라우저 뒤로가기로 이전 폴더 복귀 | dep jump 후 뒤로가기 → 원래 폴더 |
