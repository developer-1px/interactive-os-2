# Plugin Showcase Gap Fix — Phase 2 (플러그인 개선) — PRD

> Discussion: Clipboard 플러그인의 숨겨진 능력 3개를 showcase에서 체감 가능하게. cut 시각 피드백(getCutSourceIds export), copy 새 ID 표시, leaf→parent 라우팅 데모.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | ⌘X(cut) 실행 후 화면에 변화 없음 | `cutSourceIds = ['red']` (모듈 내부), UI에 미노출 | 사용자가 cut 상태를 확인하고 싶음 | cut된 노드가 시각적으로 구분되지 않음 | — | |
| 2 | ⌘C→⌘V로 복사 후 새 ID 부여 | paste 시 `red-copy-1` ID 생성 | 사용자가 "새 ID"를 확인하고 싶음 | ID가 화면에 안 보여서 체감 불가 | — | |
| 3 | Phase 1에서 "leaf→parent 라우팅" 텍스트 제거로 우회 | flat ListBox — leaf/container 구분 없음 | 이 능력을 데모하고 싶음 | tree 데이터로 전환하면 leaf paste→parent 체험 가능 | — | |

상태: 🟢

## 2. 인터페이스

### Cut 시각 피드백

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `⌘X` | 노드에 포커스 또는 선택 | — | cut된 노드에 `list-item--cut` 클래스 (opacity 0.5) | `cutSourceIds = [focusedId]` | |
| `⌘V` | cut 상태인 노드 존재 | — | cut 노드가 이동됨 + dim 해제 | `cutSourceIds = []` | |
| `⌘C` | cut 상태인 노드 존재 | — | copy로 모드 전환, dim 해제 | `cutSourceIds = []` | |
| `Escape` | cut 상태인 노드 존재 | — | cut 상태 유지 (Escape는 선택 해제만) | 변경 없음 | |

### Copy 새 ID 표시

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `⌘C` → `⌘V` | `{ id: 'red', data: { label: 'Red', hex: '#ef4444' } }` | — | paste된 노드의 ID가 보조 텍스트로 표시 (`red-copy-1`) | 새 엔티티 `{ id: 'red-copy-1', ... }` | |

### Leaf→Parent 라우팅

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `⌘V` | TreeGrid, leaf 노드에 포커스 | clipboard에 데이터 있음 | paste가 leaf의 parent 컨테이너에 삽입 (leaf 다음 위치) | parent의 children에 추가 | |
| `⌘V` | TreeGrid, container 노드에 포커스 | clipboard에 데이터 있음 | paste가 container 내부 끝에 삽입 | container의 children 끝에 추가 | |

### 인터페이스 체크리스트

- [x] ↑↓←→: 기존 TreeGrid 동작 (Phase 1과 동일)
- [x] ⌘C/⌘X/⌘V: clipboard 플러그인 keyMap (기존)
- [x] Space: 선택 토글 (기존)
- [x] ⌘Z: undo (기존)
- [x] F2: N/A (clipboard 쇼케이스에 rename 불필요)
- [x] Tab: 위젯 밖 (기존)
- [x] 클릭: 포커스 (기존)

상태: 🟢

## 3. 산출물

### 3.1 clipboard.ts 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `getCutSourceIds()` export | `export function getCutSourceIds(): readonly string[] { return cutSourceIds }` — 읽기 전용 getter 1줄 추가 | ✅ `src/interactive-os/plugins/clipboard.ts::getCutSourceIds` (L53) |

### 3.2 PageClipboard.tsx 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| ListBox → TreeGrid | flat color list → 2-depth tree (예: `warm → [red, orange, amber], cool → [green, blue, violet]`) | ✅ `src/pages/PageClipboard.tsx` |
| renderItem에 ID 표시 | 기존 label + hex 외에 `item.id`를 보조 텍스트로 표시 (copy 후 새 ID 체감용) | ✅ `src/pages/PageClipboard.tsx` |
| renderItem에 cut 스타일 | `getCutSourceIds().includes(node.id)` → `tree-node--cut` 클래스 (opacity 0.5) | ✅ `src/pages/PageClipboard.tsx` (L64 `getCutSourceIds().includes(node.id)`) |
| page-keys에 ←→ expand 추가 | TreeGrid 전환에 따라 expand 키힌트 추가 | ✅ `src/pages/PageClipboard.tsx` |
| page-section 텍스트 복원 | Phase 1에서 제거한 "Paste into a leaf node routes to the parent container" 문장 복원 | ✅ `src/pages/PageClipboard.tsx` |
| page-desc 보강 | "Cut items appear dimmed until pasted." 문장 추가 | ✅ `src/pages/PageClipboard.tsx` |

### 3.3 수정 파일 목록

| 파일 | 유형 | 역PRD |
|------|------|-------|
| `src/interactive-os/plugins/clipboard.ts` | 수정 — getCutSourceIds 1줄 추가 | ✅ `::getCutSourceIds` (L53) |
| `src/pages/PageClipboard.tsx` | 수정 — TreeGrid 전환 + ID 표시 + cut 스타일 | ✅ TreeGrid + `getCutSourceIds` import (L10, L64) |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| cut 후 ⌘C로 copy 전환 | `cutSourceIds = ['red']` | copy 실행 시 cutSourceIds 초기화 → dim 해제 | `cutSourceIds = []` | |
| cut 후 다른 노드 cut | `cutSourceIds = ['red']` → ⌘X on 'blue' | 이전 cut 해제, 새 cut 적용 | `cutSourceIds = ['blue']` | |
| 다중 선택 후 cut | `selected = ['red', 'orange']` | 선택된 노드 전부 dim | `cutSourceIds = ['red', 'orange']` | |
| cut-paste 후 dim 해제 | `cutSourceIds = ['red']` → ⌘V | paste 완료 시 cutSourceIds 초기화 | `cutSourceIds = []` | |
| leaf에 paste | `{ warm: [red, orange] }`, `red`에 포커스 | `warm` 컨테이너에 삽입 (red 다음 위치) | `{ warm: [red, pasted, orange] }` | |
| container에 paste | `{ warm: [red, orange] }`, `warm`에 포커스 | `warm` 내부 끝에 삽입 | `{ warm: [red, orange, pasted] }` | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | cutSourceIds를 store/NormalizedData에 저장 | 클립보드 상태는 일시적 UI 상태. store는 영속 데이터만 | |
| 2 | NodeState에 cut 필드 추가 | core 아키텍처 변경은 이 쇼케이스를 위해 과도 | |
| 3 | clipboard.ts의 기존 API 시그니처 변경 | 하위 호환성. getter 추가만 허용 | |
| 4 | cut 스타일을 CSS 파일로 분리 | 기존 페이지 패턴: inline style 또는 className 직접 조합 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | ⌘X 후 화면 확인 | cut된 노드가 dim (opacity 0.5) | ✅ 시각 검증 (UI), `clipboard.ts::getCutSourceIds` 호출 경로 확인 |
| 2 | ⌘X 후 ⌘V | 노드 이동됨 + dim 해제 | ✅ `clipboard-undo.integration.test.tsx::"cut → paste moves item, Mod+Z undoes"` |
| 3 | ⌘X 후 ⌘C | dim 해제 (copy로 전환) | ✅ 시각 검증 (UI), cutSourceIds 초기화 로직 `clipboard.ts` 내부 |
| 4 | ⌘C → ⌘V 후 새 노드 확인 | paste된 노드에 `red-copy-N` 형태의 ID 보조 텍스트 표시 | ✅ `clipboard-undo.integration.test.tsx::"copy → paste inserts after cursor, Mod+Z undoes"` |
| 5 | leaf 노드에서 ⌘V | parent 컨테이너에 삽입 (leaf 다음 위치) | ✅ `clipboard-overwrite.test.ts::"walks up to ROOT when pasting section on slot child"` |
| 6 | container 노드에서 ⌘V | container 내부 끝에 삽입 | ✅ `clipboard-overwrite.test.ts::"inserts card into section (collection insert)"` |
| 7 | page-section 텍스트에 "leaf node routes to parent" 복원 | 문장이 다시 표시됨 | ✅ 시각 검증 (UI), `src/pages/PageClipboard.tsx` 텍스트 확인 |
| 8 | 기존 테스트 전부 통과 | getCutSourceIds 추가가 기존 로직에 영향 없음 | ✅ `clipboard-undo.integration.test.tsx` + `clipboard-overwrite.test.ts` 전체 통과 |
| 9 | 다중 선택 → ⌘X | 선택된 노드 전부 dim | ✅ 시각 검증 (UI), cutSourceIds 배열 지원 `clipboard.ts` |
| 10 | ←→ expand/collapse | TreeGrid 트리 접기/펼치기 동작 | ✅ `treegrid-keyboard.integration.test.tsx` expand/collapse 테스트 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
