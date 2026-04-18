import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# List X-ray — PRD

> Discussion: 리스트뷰를 "프로젝트 X-ray"로 — TreeGrid 메타데이터 컬럼 + 정렬 + 필터

## ① 동기

### WHY

- **Impact**: 리스트뷰와 컬럼뷰가 렌더링 방식만 다르고 기능 차이 없음. "이 폴더에서 가장 큰 파일은?", "테스트 파일만 보고 싶다" 같은 분석 질문에 답할 수 없음.
- **Forces**: FileTreeView는 트리 렌더링만 함 vs 개발자는 파일의 메타데이터(LOC, 타입)로 판단해야 함. 기존 부품만 사용해야 하는 제약.
- **Assets**: TreeGrid(ColumnDef), FilterBar, SortIndicator, TreeNode.loc, NormalizedData relationships 순서
- **Decision**: FileTreeView → TreeGrid 교체. 기각: Table(트리 없음), Grid(트리 없음). TreeGrid만 트리+컬럼 하이브리드.
- **Non-Goals**: fsClient API 확장 (수정일/크기), TreeGrid 자체에 정렬 기능 내장 (PageViewer에서 store 변환으로 처리), full-text 검색

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 리스트뷰 상태 | 페이지 로드 | TreeGrid에 Name, Type, LOC 컬럼 헤더 표시. 파일마다 확장자와 LOC 값 표시 | |
| M2 | 리스트뷰 | LOC 헤더 클릭 | 파일이 LOC 내림차순 정렬. 다시 클릭하면 오름차순 토글 | |
| M3 | 리스트뷰 | Name 헤더 클릭 | 알파벳순 정렬 | |
| M4 | 리스트뷰 | Type 헤더 클릭 | 확장자별 그룹 정렬 (.css → .md → .ts → .tsx) | |
| M5 | 리스트뷰 | FilterBar에서 ".tsx" 칩 추가 | .tsx 파일만 표시. 폴더는 .tsx 자식이 있는 것만 유지 | |
| M6 | 필터 적용 중 | 필터 칩 제거 | 전체 파일 다시 표시 | |
| M7 | 정렬 + 필터 동시 | LOC 정렬 + .tsx 필터 | .tsx 파일만 LOC 순으로 정렬 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| \`PageViewer.tsx\` 수정 | 리스트뷰를 FileTreeView → TreeGrid로 교체. ColumnDef 정의, 정렬/필터 상태, store 변환 함수 | |
| \`viewerSort.ts\` (viewer/) | NormalizedData를 정렬하는 순수 함수: \`sortStore(store, sortKey, direction)\` → relationships 재정렬 | |
| \`viewerFilter.ts\` (viewer/) | NormalizedData를 필터하는 순수 함수: \`filterStore(store, extensions)\` → entities/relationships 필터 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| LOC 헤더 클릭 | sortKey=null | sortKey='loc', dir='desc' | 첫 클릭은 내림차순 (큰 것부터 = 가장 유용한 정보 먼저) | TreeGrid가 LOC 내림차순으로 렌더 | |
| LOC 헤더 재클릭 | sortKey='loc', dir='desc' | dir='asc' | 같은 키 재클릭 = 방향 토글 | LOC 오름차순 | |
| Name 헤더 클릭 | sortKey='loc' | sortKey='name', dir='asc' | 다른 키 클릭 = 새 정렬. 이름은 오름차순이 자연스러움 | Name 알파벳순 | |
| 정렬 중 Name 재클릭 | sortKey='name', dir='asc' | dir='desc' | 토글 | Name 역순 | |
| FilterBar ".tsx" 추가 | filters=[] | filters=['.tsx'] | 확장자 매칭. 폴더는 매칭 자식이 있으면 유지 | .tsx 파일 + 부모 폴더만 표시 | |
| FilterBar ".tsx" 제거 | filters=['.tsx'] | filters=[] | 필터 해제 → 전체 복원 | 전체 파일 표시 | |
| 파일 클릭 | 리스트뷰 | handleChange → previewPath 설정 | 기존 follow-focus preview 동작 유지 | 우측 SidePanel에 FilePanel 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| loc 없는 파일 (directory) | LOC 정렬 | 폴더에는 LOC가 없음. 정렬에서 제외하면 혼란 | loc 없으면 0 취급. 폴더는 항상 파일 위에 위치 | 폴더 먼저 → 파일 LOC순 | |
| 필터 결과 0건 | ".css" 필터인데 css 파일 없음 | 빈 화면보다 피드백 필요 | EmptyState: "No files match filter" | EmptyState 표시 | |
| 정렬 + 트리 계층 | LOC 정렬 | 트리 정렬은 같은 depth 내에서만 적용해야 계층 유지 | 각 부모의 children만 재정렬 (전역 flat sort 아님) | 트리 구조 유지 + depth 내 정렬 | |
| 루트 전환 (src↔docs) | 정렬/필터 적용 중 | 루트 바뀌면 데이터가 바뀜. 정렬/필터 조건은 유지 | 새 데이터에 기존 정렬/필터 재적용 | 정렬/필터 유지 + 새 데이터 | |
| viewmode 전환 (list↔columns) | 정렬/필터 적용 중 | 컬럼뷰에서는 정렬/필터 불필요 | 정렬/필터 상태 유지하되 컬럼뷰에서는 무시. 리스트로 돌아오면 복원 | 상태 보존 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | sortKey, sortDir, filters | ⚠ 위반 가능 | sortKey/sortDir/filters는 view preference (undo 불필요). @useState-hatch 선언 — viewMode와 동일 판단 | |
| 2 | os 기반 개발 — ui/ 완성품만 사용 (CLAUDE.md) | TreeGrid 사용 | ✅ 준수 | TreeGrid는 기존 ui/ 부품 | |
| 3 | renderItem에 ARIA props 전달 필수 (CLAUDE.md) | TreeGrid renderItem/renderCell | ✅ 준수 예정 | TreeGrid가 내부적으로 처리 | |
| 4 | ax()만 사용 (feedback_style_is_hatch) | 추가 CSS | ✅ 준수 | 새 CSS 불필요 | |
| 5 | viewer/fsClient.ts 경로 유지 (finder-viewer-prd ⑦) | viewerSort.ts, viewerFilter.ts | ✅ 준수 | viewer/ 내부 새 파일, 외부 의존 없음 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | FileTreeView 제거 | 리스트뷰에서 FileTreeView 대신 TreeGrid 사용 | low | FileTreeView 자체는 ui/ 부품으로 남음. import만 교체 | |
| 2 | handleChange의 focusedId 추적 | TreeGrid의 focus 엔티티 구조가 FileTreeView와 다를 수 있음 | medium | 둘 다 \`__focus__.focusedId\`를 사용하므로 동일 (?) — 확인 필요 | |
| 3 | 정렬된 store를 MillerColumns에 전달하면 안 됨 | 컬럼뷰에 정렬이 적용되면 탐색 순서가 혼란 | medium | 정렬/필터는 리스트뷰에서만 적용. 원본 initialStore를 컬럼뷰에 전달 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | 컬럼뷰에 정렬/필터 적용 | ⑥#3 | 컬럼뷰는 탐색 도구. 정렬하면 폴더 drill 순서가 혼란 | |
| 2 | initialStore 직접 변형 | ⑥#2 | 원본 보존. 정렬/필터는 파생 데이터 (useMemo) | |
| 3 | TreeGrid에 정렬 로직 내장 | ⑤ scope | PageViewer의 관심사. TreeGrid는 범용 ui 부품으로 유지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | 리스트뷰 로드 | Name, Type, LOC 컬럼 헤더 + 파일별 메타데이터 표시 | |
| V2 | ①M2 | LOC 헤더 클릭 | LOC 내림차순 정렬. SortIndicator 표시 | |
| V3 | ①M3 | Name 헤더 클릭 | 알파벳순 정렬 | |
| V4 | ①M5 | .tsx 필터 추가 | .tsx 파일 + 부모 폴더만 표시 | |
| V5 | ①M7 | LOC 정렬 + .tsx 필터 | .tsx 파일만 LOC 순 | |
| V6 | ④경계1 | LOC 정렬 시 폴더 | 폴더 먼저 → 파일 LOC순 | |
| V7 | ④경계2 | 필터 결과 0건 | EmptyState 표시 | |
| V8 | ④경계3 | 정렬 + 트리 계층 | 같은 depth 내에서만 정렬. 트리 구조 유지 | |
| V9 | ⑥#3 | 컬럼뷰 전환 | 원본 store 사용. 정렬/필터 미적용 | |
| V10 | 기존 | follow-focus preview | 파일 클릭 → SidePanel에 FilePanel 표시 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
`;export{t};