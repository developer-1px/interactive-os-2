# Kanban Showcase — PRD

> Discussion: 30년 FE 사실상 표준 UI 컴포넌트를 쇼케이스로 만들면서 interactive-os 각 레이어 강화. 칸반은 "컨테이너 간 이동" 축을 여는 첫 번째 쇼케이스. 독립 store + 공유 플러그인/behavior 모델.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | interactive-os의 dnd 플러그인에 `moveTo`가 있지만 | 컨테이너 간 이동을 keyboard로 수행하는 쇼케이스가 없어서 | 이 축이 실전 검증되지 않음 |
| 2 | 30년 FE에서 칸반은 사실상 표준 UI 패턴이지만 | keyboard-first 칸반 구현이 거의 없어서 | interactive-os가 이 빈 자리를 채울 수 있음 |
| 3 | Collection 레이어에 TreeGrid, Listbox, Grid, Tabs, Combobox가 있지만 | 모두 단일 컨테이너 내 조작만 보여주고 있어서 | 복수 컨테이너 합성 패턴이 증명되지 않음 |

상태: 🟢

## 2. 인터페이스

### 2.1 탐색 (Read)

| 입력 | 조건 | 결과 |
|------|------|------|
| `←` `→` | 포커스가 카드에 있을 때 | 인접 컬럼의 같은 높이(또는 마지막) 카드로 포커스 이동 |
| `↑` `↓` | 포커스가 카드에 있을 때 | 같은 컬럼 내 이전/다음 카드로 포커스 이동 |
| `Home` | 포커스가 카드에 있을 때 | 같은 컬럼의 첫 번째 카드로 포커스 |
| `End` | 포커스가 카드에 있을 때 | 같은 컬럼의 마지막 카드로 포커스 |
| `Mod+Home` | 포커스가 카드에 있을 때 | 첫 번째 컬럼의 첫 번째 카드로 포커스 |
| `Mod+End` | 포커스가 카드에 있을 때 | 마지막 컬럼의 마지막 카드로 포커스 |

### 2.2 조작 (Write)

| 입력 | 조건 | 결과 |
|------|------|------|
| `Alt+←` | 포커스가 카드에 있을 때 | 카드를 이전 컬럼으로 이동 (`moveTo`). 포커스 따라감 |
| `Alt+→` | 포커스가 카드에 있을 때 | 카드를 다음 컬럼으로 이동 (`moveTo`). 포커스 따라감 |
| `Alt+↑` | 포커스가 카드에 있을 때 | 같은 컬럼 내 위로 리오더 (`moveUp`) |
| `Alt+↓` | 포커스가 카드에 있을 때 | 같은 컬럼 내 아래로 리오더 (`moveDown`) |
| `Space` | 포커스가 카드에 있을 때 | 카드 선택 토글 (일괄 조작용) |
| `Mod+A` | 포커스가 카드에 있을 때 | 같은 컬럼 내 전체 선택 |
| `Enter` | 카드에 포커스, rename 비활성 | rename 시작 (F2와 동일. 카드 상세 dialog는 이 단계 범위 밖) |
| `F2` | 카드에 포커스 | 카드 제목 rename 시작 (`Aria.Editable`) |
| `Escape` | rename 활성 | rename 취소 |
| `Escape` | rename 비활성 | 선택 해제 |
| `N` or `Ctrl+Enter` | 포커스가 카드에 있을 때 | 포커스된 카드 아래에 새 카드 생성 |
| `Delete` | 카드 선택됨 | 선택된 카드 삭제 |
| `Mod+Z` | — | undo |
| `Mod+Shift+Z` | — | redo |
| `Mod+C` | 카드 선택됨 | 복사 |
| `Mod+X` | 카드 선택됨 | 잘라내기 |
| `Mod+V` | 포커스가 카드에 있을 때 | 포커스된 위치에 붙여넣기 |

### 2.3 인터페이스 체크리스트

- [x] ↑ 키: 컬럼 내 이전 카드
- [x] ↓ 키: 컬럼 내 다음 카드
- [x] ← 키: 이전 컬럼으로 포커스 이동
- [x] → 키: 다음 컬럼으로 포커스 이동
- [x] Enter: rename 시작 (F2와 동일)
- [x] Escape: rename 취소 / 선택 해제
- [x] Space: 선택 토글
- [x] Tab: 칸반 밖으로 포커스 이동 (ARIA 관례 — Tab은 위젯 간, Arrow은 위젯 내부)
- [x] Home/End: 컬럼 내 첫/마지막
- [x] Mod 조합: undo/redo, copy/cut/paste, 전체 선택
- [x] 클릭: 포커스 + 선택 (기존 패턴)
- [x] 더블클릭: rename 시작 (기존 패턴)
- [x] 이벤트 버블링: 단일 `<Aria>` 컨테이너, 컬럼 간 격리 불필요

상태: 🟢

## 3. 산출물

### 3.1 Store 구조

```
entities:
  column-todo:     { id: 'column-todo', data: { title: 'To Do' } }
  column-progress: { id: 'column-progress', data: { title: 'In Progress' } }
  column-done:     { id: 'column-done', data: { title: 'Done' } }
  card-1:          { id: 'card-1', data: { title: '...', description: '...' } }
  card-2:          { id: 'card-2', data: { title: '...', description: '...' } }
  ...

relationships:
  __root__: ['column-todo', 'column-progress', 'column-done']
  column-todo: ['card-1', 'card-2', 'card-3']
  column-progress: ['card-4']
  column-done: ['card-5', 'card-6']
```

컬럼 = 1depth 엔티티, 카드 = 2depth 엔티티. 기존 normalized store 그대로.

### 3.2 Behavior: `kanban`

새 behavior 파일. grid behavior의 변형:

- **role**: `grid` — 2D 네비게이션 (컬럼 × 카드)
- **childRole**: `row` — 각 카드가 row
- **focusStrategy**: `roving-tabindex`, orientation `both`
- **keyMap**: 위 인터페이스 표 기준
- **특수 로직**: `←` `→`가 컬럼 간 이동일 때, 대상 컬럼에서 같은 index(또는 마지막) 카드에 포커스. 빈 컬럼이면 컬럼 헤더(1depth 엔티티)에 포커스
- **컬럼 헤더 포커스**: 빈 컬럼에서 포커스 대상은 컬럼 엔티티 자체. 여기서 `N`으로 카드 생성 가능

### 3.3 UI 컴포넌트

새 UI 컴포넌트 `Kanban.tsx` — 페이지에서 `<Aria>` 직접 조합하지 않고, 재사용 가능한 컴포넌트로 분리. 기존 `TreeGrid.tsx`, `Grid.tsx`와 동일 패턴.

### 3.4 Collection 페이지

`/collection/kanban` 라우트. 기존 Collection 페이지 패턴:
- page-header + 설명
- page-keys (키보드 힌트)
- 칸반 보드 카드
- 자체 키보드 인터랙션 표 (APG 패턴이 아니므로 ApgKeyboardTable 대신 직접 작성)

### 3.5 데모 데이터

`shared-kanban-data.ts` — 3~4개 컬럼, 총 8~12개 카드

### 3.6 파일 목록

| 파일 | 유형 | 설명 | 역PRD |
|------|------|------|-------|
| `src/interactive-os/behaviors/kanban.ts` | 신규 | kanban behavior | ✅ `behaviors/kanban.ts::kanban` (composePattern) |
| `src/interactive-os/ui/Kanban.tsx` | 신규 | 칸반 UI 컴포넌트 | ✅ `ui/Kanban.tsx::Kanban` |
| `src/pages/collection/PageKanban.tsx` | 신규 | Collection 쇼케이스 페이지 | ✅ `pages/PageKanban.tsx::PageKanban` (경로 변경) |
| `src/pages/data/shared-kanban-data.ts` | 신규 | 데모 데이터 | ✅ `pages/shared-kanban-data.ts::kanbanInitialData` (경로 변경) |
| `src/interactive-os/behaviors/kanban.test.ts` | 신규 | behavior 테스트 | ✅ `__tests__/kanban-keyboard.integration.test.tsx` (경로 변경) |
| `src/App.tsx` | 수정 | Collection 라우트에 kanban 추가 | ✅ `showcaseRegistry.tsx` (라우트 등록 방식 변경) |

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 빈 컬럼에서 `↑` `↓` | 아무 일 없음 (카드 없으므로) |
| 빈 컬럼으로 `Alt+→` 카드 이동 | 카드가 빈 컬럼의 첫 번째 자식이 됨 |
| 빈 컬럼에서 `←` `→` | 컬럼 헤더에 포커스. 컬럼도 엔티티이므로 포커스 가능 |
| 첫 번째 컬럼에서 `Alt+←` | 아무 일 없음 (이동할 컬럼 없음) |
| 마지막 컬럼에서 `Alt+→` | 아무 일 없음 |
| 카드가 1개인 컬럼에서 `Alt+↑` | 아무 일 없음 |
| `Alt+←/→` 이동 후 대상 컬럼에서의 카드 위치 | 같은 index 유지. 대상 컬럼이 짧으면 마지막. 이유: `Alt+→` 후 `Alt+←`로 원래 위치 복귀 가능해야 함 (가역적 동선) |
| 다중 선택 후 `Alt+→` | 선택된 카드 전부 이동 (BatchCommand). 포커스된 카드의 index 기준으로 삽입 위치 결정 |
| 컬럼 간 이동 후 undo | 원래 컬럼 + 원래 위치로 복귀 |
| rename 중 `Alt+→` | 이동 무시. rename이 우선. Alt+Arrow는 macOS에서 텍스트 커서 단어 이동에 쓰임. 기존 Aria.Editable이 rename 중 keyMap 비활성 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | 컬럼을 새 엔티티 타입으로 만들지 않는다 | 기존 normalized store의 부모-자식 관계로 충분. 새 타입은 store 복잡도 증가 |
| 2 | pointer dnd를 이 단계에서 구현하지 않는다 | keyboard-first로 조작 축을 먼저 확립. pointer는 별도 단계 |
| 3 | 카드 상세 dialog를 이 단계에서 구현하지 않는다 | 칸반 behavior + 컨테이너 간 이동에 집중 |
| 4 | 기존 플러그인을 수정하지 않는다 | 기존 플러그인 재사용이 목적. moveTo가 이미 cross-parent 지원 |
| 5 | WIP 제한 등 도메인 로직을 넣지 않는다 | 프레임워크 쇼케이스이지 칸반 앱이 아님 |
| 6 | 자체 ARIA 용어를 발명하지 않는다 | 기존 ARIA role/attribute 재사용 (naming convention 원칙) |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | `Alt+→`로 카드를 다음 컬럼으로 이동 | store에서 카드의 parent가 변경됨. UI에서 카드가 다음 컬럼에 표시 | ✅ `kanban-keyboard.integration.test.tsx::Alt+ArrowRight moves card to next column` |
| 2 | 이동 후 `Mod+Z` | 카드가 원래 컬럼 + 원래 위치로 복귀 | ✅ `kanban-keyboard.integration.test.tsx::Mod+Z undoes cross-column move` |
| 3 | `←` `→`로 컬럼 간 포커스 이동 | 포커스가 인접 컬럼의 카드로 이동. store 변경 없음 | ✅ `kanban-keyboard.integration.test.tsx::ArrowRight moves to same-index card in next column` |
| 4 | `↑` `↓`로 컬럼 내 탐색 | 같은 컬럼 내 카드 간 포커스 이동 | ✅ `kanban-keyboard.integration.test.tsx::ArrowDown moves to next card in same column` |
| 5 | `Alt+↑` `Alt+↓`로 컬럼 내 리오더 | moveUp/moveDown으로 카드 순서 변경 | ✅ `kanban-keyboard.integration.test.tsx::Alt+ArrowDown reorders card down within column` |
| 6 | `F2`로 rename 진입 → Enter로 확정 | 카드 제목 변경, rename 모드 종료 | — |
| 7 | `Space`로 다중 선택 → `Delete` | 선택된 카드들 일괄 삭제 | ✅ `kanban-keyboard.integration.test.tsx::Space toggles selection on focused card`, `Delete removes focused card` |
| 8 | 빈 컬럼으로 카드 이동 | 카드가 빈 컬럼의 유일한 자식이 됨 | — |
| 9 | 기존 플러그인 전체 동작 | copy/cut/paste, create, delete, undo/redo 모두 칸반에서 동작 | ✅ `kanban-keyboard.integration.test.tsx::N creates a new card after focused card` |
| 10 | ARIA 속성 검증 | axe-core 접근성 위반 없음 | — |
| 11 | `Alt+→` 후 `Alt+←` (가역성) | 카드가 원래 컬럼 + 원래 index로 복귀 (undo 없이) | ✅ `kanban-keyboard.integration.test.tsx::Alt+ArrowRight then Alt+ArrowLeft is reversible` |
| 12 | 빈 컬럼으로 `→` 포커스 이동 | 컬럼 헤더 엔티티에 포커스 | ✅ `kanban-keyboard.integration.test.tsx::ArrowRight into empty column focuses column header` |
| 13 | 빈 컬럼에서 `N` | 컬럼의 첫 번째 자식으로 새 카드 생성 | — |
| 14 | 다중 선택 + `Alt+→` | 선택된 카드 전부 BatchCommand로 이동, undo 시 전부 복귀 | — |
| 15 | rename 중 `Alt+→` | 이동 무시, rename 계속 | — |
| 16 | Tab 키 | 칸반 위젯 밖으로 포커스 이동 | — |

상태: 🟢

---

**전체 상태:** 🟢 6/6
