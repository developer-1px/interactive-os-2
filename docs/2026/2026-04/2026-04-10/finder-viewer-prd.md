---
id: 1-projects/finder-viewer/prds/finder-viewer-prd
title: 'Finder Viewer — PRD'
status: active
kind: prd
created: 2026-04-10
updated: 2026-04-10
summary: 'Discussion: viewer + docs를 Finder 스타일 단일 탐색 UI로 통합. Apple 미니멀 컨셉.'
topics: [1-projects]
relates: []
supersedes: []
---
# Finder Viewer — PRD

> Discussion: viewer + docs를 Finder 스타일 단일 탐색 UI로 통합. Apple 미니멀 컨셉.

## ① 동기

### WHY

- **Impact**: 코드(src)와 문서(docs)가 별도 라우트로 분리되어 있어, 하나의 프로젝트를 탐색하는데 경험이 단절된다.
- **Forces**: 현재 PageViewer가 VS Code 메타포(풀트리+탭 에디터)로 설계됨 vs Finder 메타포(즐겨찾기+viewmode+Quick Look)가 필요. 기존 부품만 사용해야 하는 제약.
- **Decision**: Finder 메타포 채택. 사이드바를 즐겨찾기(src, docs)로 단순화하고, 메인 영역을 viewmode(리스트/컬럼) 전환으로. 기각 대안: B(사이드바 없이 전체 viewmode) — 진입점 없음, Finder와 불일치.
- **Non-Goals**: 아이콘뷰/갤러리뷰, 태그/Favorites 시스템, full-text 검색, 새 UI 부품 개발.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 사용자가 /viewer에 진입 | 페이지 로드 | 사이드바에 src, docs 즐겨찾기 표시. 메인 영역에 기본 루트(src)의 리스트뷰 | |
| M2 | 리스트뷰 상태 | toolbar에서 컬럼뷰 버튼 클릭 | 메인 영역이 MillerColumns로 전환. 같은 폴더 위치 유지 | |
| M3 | 컬럼뷰 상태 | toolbar에서 리스트뷰 버튼 클릭 | 메인 영역이 FileTreeView로 전환. 같은 포커스 위치 유지 | |
| M4 | 사이드바에서 docs 클릭 | activate | 메인 영역 루트가 docs/로 전환. viewmode 유지 | |
| M5 | 파일에 포커스 | 스페이스바 | FileViewerModal로 Quick Look 오버레이. 파일 미리보기 | |
| M6 | Quick Look 열린 상태 | 스페이스바 또는 Esc | Quick Look 닫힘. 포커스 복귀 | |
| M7 | 아무 상태 | Cmd+P 또는 toolbar 검색 버튼 | QuickOpen 오버레이. 파일명 fuzzy 검색 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `PageViewer.tsx` 리팩토링 | 기존 SplitPane(FileTree\|Workspace) → SplitPane(NavList사이드바\|viewmode메인+floatingToolbar) | |
| `FinderToolbar.tsx` (ui/) | floating toolbar — viewmode 토글 + 검색 트리거. Toolbar 기반 | |
| `FinderToolbar.css` (ui/) | sticky + backdrop-filter. @layer component 래핑 | |
| `viewerWorkspace.ts` 삭제 | Workspace 탭 로직 제거 (Quick Look으로 대체) | |
| `router.tsx` 수정 | URL 스키마 유지 (/viewer/*). 변경 없음 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 사이드바 src 클릭 | 루트=docs, viewmode=list | NavList activate → fetchTree(src루트) | 즐겨찾기는 루트 전환 트리거. 각 즐겨찾기가 독립 트리 루트 | 루트=src, 메인에 src 리스트뷰 | |
| 사이드바 docs 클릭 | 루트=src, viewmode=columns | NavList activate → fetchTree(docs루트) | 동일. viewmode는 루트 전환에 영향받지 않음 | 루트=docs, 메인에 docs 컬럼뷰 | |
| toolbar 컬럼뷰 버튼 | viewmode=list | viewmode → 'columns' | viewmode는 렌더 컴포넌트 선택 기준. 데이터(store)는 불변 | viewmode=columns, MillerColumns 렌더 | |
| toolbar 리스트뷰 버튼 | viewmode=columns | viewmode → 'list' | 동일 역방향 | viewmode=list, FileTreeView 렌더 | |
| 파일 노드에서 Space | 포커스된 파일 있음, quickLookPath=null | quickLookPath=focusedFilePath | Space=Quick Look 토글 (Finder 표준). popup 축으로 모달 | quickLookPath=filePath, FileViewerModal 열림 | |
| Quick Look에서 Space/Esc | quickLookPath=filePath | quickLookPath=null | 동일 키로 토글 닫기. Esc는 dismiss 표준 | quickLookPath=null, 모달 닫힘, 포커스 복귀 | |
| Cmd+P | 아무 상태 | QuickOpen 열림 | 기존 QuickOpen 트리거 유지 | QuickOpen 오버레이 | |
| ↑↓ 키 (리스트뷰) | FileTreeView 포커스 | navigate 축 수직 이동 | tree 패턴 기본 동작 | 포커스 이동 | |
| ←→ 키 (컬럼뷰) | MillerColumns 포커스 | millerDrill(←drillOut, →drillIn) | miller 프리셋 기본 동작 | 컬럼 이동 | |
| 파일 더블클릭/Enter | 파일 포커스 | activate → quickLookPath 설정 | activate=파일 열기. Quick Look으로 통일 | FileViewerModal 열림 | |
| 폴더 더블클릭/Enter (리스트) | 폴더 포커스 | expand 토글 | tree 패턴 기본 | 폴더 확장/축소 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 폴더 (자식 없음) | 컬럼뷰에서 빈 폴더 선택 | 빈 컬럼이 뜨면 혼란. Finder도 빈 폴더는 "항목 없음" 표시 | EmptyState 렌더 | 빈 컬럼에 EmptyState | |
| fetchTree 실패 (네트워크) | 루트 전환 시도 | 데이터 없이 빈 화면보다 에러 피드백 필요 | 이전 루트 유지 + 에러 표시 | 이전 상태 유지 | |
| viewmode 전환 중 포커스 위치 | list에서 깊은 노드 포커스 → columns 전환 | 포커스 노드가 보존되어야 사용자가 위치를 잃지 않음 | 동일 nodeId에 포커스 유지. MillerColumns가 해당 경로까지 컬럼 전개 | 포커스 보존 | |
| Quick Look 중 루트 전환 | Quick Look 열린 상태에서 사이드바 클릭 | 루트가 바뀌면 현재 미리보기 파일이 새 루트에 없을 수 있음 | Quick Look 닫고 루트 전환 | quickLookPath=null, 새 루트 로드 | |
| HMR fs:tree-update | 뷰 사용 중 파일 변경 | 기존 PageViewer의 HMR 로직 유지. 포커스/확장 보존 | 트리 갱신, 포커스 보존 | 갱신된 store | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | viewmode, quickLookPath, currentRoot | ⚠ 위반 가능 | viewmode는 store 메타 엔티티 또는 별도 NormalizedData로. quickLookPath는 popup 축 (?) — FileViewerModal이 자체 dialog 관리하므로 prop 전달로 충분할 수 있음 | |
| 2 | 화면을 가리면 modal 취급, popup 축 필수 (feedback_overlay_is_modal) | Quick Look(FileViewerModal) | ✅ 준수 | FileViewerModal이 이미 dialog 네이티브 모달 사용 | |
| 3 | ax()만 사용, style={} 금지 (feedback_style_is_hatch) | FinderToolbar CSS | ✅ 준수 예정 | backdrop-filter는 module.css @layer component last-mile | |
| 4 | surface 소유 속성에 module.css 금지 (feedback_surface_no_lastmile) | FinderToolbar 배경색 | ⚠ 주의 | background는 surface 축이 소유. backdrop-filter만 last-mile으로. background는 ax() surface 값 사용 | |
| 5 | @layer cascade 잠금 (feedback_css_layer_lock) | FinderToolbar.css | ✅ 준수 예정 | @layer component 래핑 | |
| 6 | os 기반 개발 (CLAUDE.md) | 전체 구조 | ✅ 준수 | ui/ 부품만 사용. pages에서 useAria 직접 사용 금지 | |
| 7 | padding은 layout 유형이 결정 (feedback_padding_by_layout_type) | toolbar 패딩 | ✅ 준수 예정 | toolbar = 바 유형 → xs/sm | |
| 8 | accent 1채널 (feedback_accent_budget) | viewmode 선택 상태 | ✅ 준수 예정 | selected=neutral, activate=accent, focus=accent outline | |
| 9 | interactive 축 필수 (CLAUDE.md) | toolbar 버튼들 | ✅ 준수 예정 | interactive: 'button' | |

**#1 viewmode 상태 판정**: viewmode(`'list' | 'columns'`)는 view preference이지 도메인 데이터가 아니다. 그러나 feedback_all_state_normalized_command가 "예외 없음"을 명시. 두 가지 접근:
- (A) store 메타 엔티티 `{ id: 'viewmode', data: { value: 'list' } }` + SetViewMode command
- (B) @useState-hatch 주석으로 예외 선언 (현재 PageViewer에서도 sizes, quickOpenVisible에 사용 중)

**판단**: viewmode는 undo 대상이 아니고 localStorage 영속이 자연스러우므로 (B) @useState-hatch가 적합. 현재 PageViewer도 동일 패턴.

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | viewerWorkspace.ts (previewFile/pinFile 리듀서) | Workspace 탭 제거로 dead code 됨 | low | 삭제. PageViewer만 사용 중 | |
| 2 | PageDocs.tsx (viewer/fsClient, treeTransform, DocsPreview import) | viewer/ 내부 파일 경로 유지하면 무관 | medium | fsClient, treeTransform, types는 viewer/ 경로 유지. DocsPreview는 확인 필요 | |
| 3 | PageBirdseye.tsx (viewer/fsClient, types import) | 동일 — 경로 유지하면 무관 | low | 유지 | |
| 4 | replay 파일들 (viewerStore, timelineSSE import) | viewer/ 경로 유지하면 무관 | low | 유지 | |
| 5 | 기존 Workspace 탭 워크플로 | 탭으로 여러 파일 동시 열기가 사라짐 | medium | Quick Look이 대체. 허용 — Finder 메타포로 전환하는 의도적 변경 | |
| 6 | URL 스키마 (/viewer/*) | 변경 없음. 루트 전환은 query param 또는 store 내부로 | low | URL은 현재 포커스된 파일 경로 유지. 루트(src/docs) 정보는 localStorage | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | pages에서 useAria/useAriaZone 직접 사용 | ⑤#6 os 기반 개발 | ui/ 부품만. FinderToolbar를 ui/에 만들어야 함 | |
| 2 | toolbar background를 module.css에 작성 | ⑤#4 surface_no_lastmile | surface 축이 소유. ax() surface 값 사용 | |
| 3 | unlayered CSS 추가 | ⑤#5 css_layer_lock | @layer component 필수 | |
| 4 | style={} 사용 | ⑤#3 style_is_hatch | ax()만. backdrop-filter만 module.css last-mile | |
| 5 | viewer/fsClient.ts 경로 변경 | ⑥#2,3,4 | PageDocs, PageBirdseye, replay가 의존 | |
| 6 | 이모지/특수기호로 viewmode 아이콘 대용 | CLAUDE.md os 규칙 | ui/indicators/ 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | /viewer 진입 | 사이드바에 src, docs. 메인에 src 리스트뷰 | |
| V2 | ①M2 | 컬럼뷰 버튼 클릭 | MillerColumns 렌더. 포커스 위치 보존 | |
| V3 | ①M3 | 리스트뷰 버튼 클릭 | FileTreeView 렌더. 포커스 위치 보존 | |
| V4 | ①M4 | 사이드바 docs 클릭 | 메인 루트가 docs/로 전환. viewmode 유지 | |
| V5 | ①M5 | 파일 포커스 + Space | FileViewerModal 열림. 파일 미리보기 표시 | |
| V6 | ①M6 | Quick Look 상태 + Space | 모달 닫힘. 포커스 복귀 | |
| V7 | ①M7 | Cmd+P | QuickOpen 열림 | |
| V8 | ④경계1 | 빈 폴더 선택 (컬럼뷰) | EmptyState 표시 | |
| V9 | ④경계3 | viewmode 전환 시 포커스 보존 | 동일 nodeId에 포커스 | |
| V10 | ④경계4 | Quick Look 중 루트 전환 | 모달 닫힘 + 새 루트 로드 | |
| V11 | ⑥#5 | PageDocs, PageBirdseye 정상 동작 | viewer/fsClient 경로 유지 → 기존 기능 무파괴 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
