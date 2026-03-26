# Plugin Showcase Gap Fix — Phase 1 (페이지 수정) — PRD

> Discussion: 각 /plugin 페이지의 텍스트(=스펙)가 약속하는 것을 데모가 증명하지 못하는 갭을 메운다. 원칙: 데모를 텍스트에 맞추되, 굳이다 싶으면 텍스트를 빼는 전략.
>
> **2단계 전략:**
> - **Phase 1 (이 PRD):** 페이지 코드 + 텍스트만 수정. 플러그인 코드 변경 없음.
> - **Phase 2 → [plugin-showcase-gap-phase2-prd.md](2026-03-21-plugin-showcase-gap-phase2-prd.md):** 플러그인 개선 (cut 시각 피드백, clipboard leaf→parent 데모 등)

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | CRUD 텍스트가 "deleted subtrees restore on undo"를 약속 | flat ListBox 5개: `__root__: [t1..t5]` | 사용자가 subtree 삭제를 시도 | subtree가 없어서 체험 불가 | — | ✅ 일치 |
| 2 | History에 F2 키힌트 + "Try renaming" | `rename()` 플러그인 있으나 `<Aria.Editable>` 없음 | 사용자가 F2를 누름 | 아무 일도 안 일어남 | — | ✅ 일치 |
| 3 | Clipboard 텍스트 "Paste into a leaf node routes to parent" | flat ListBox — 모든 노드가 leaf | leaf→parent 라우팅 시도 | flat list라 구분 없어 체험 불가 | — | ✅ 일치 |
| 4 | History 데이터 3개 | `{ note1, note2, note3 }` | 여러 조작 후 undo 반복 | 스택 깊이 체감 약함 | — | ✅ 구현됨 (3→6개 확장). 역PRD에서 별도 동기로 식별하진 않았으나 산출물에서 확인 |

상태: 🟢

## 2. 인터페이스

> 기존 키보드 인터랙션은 플러그인이 제공하므로 변경 없음. 변경은 **페이지 코드와 텍스트** 한정.

### CRUD 페이지

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `Del` | TreeGrid: `{ projects: [design, api], design: [figma, sketch] }` | `design` 노드에 포커스 | `design` + 자식 `figma`, `sketch` 전부 삭제. 포커스 `api`로 복구 | `{ projects: [api] }` | ✅ 트리 데이터로 subtree 삭제 가능 |
| `⌘Z` | 위 삭제 직후 | — | `design` + `figma`, `sketch` 원래 위치에 복원 | `{ projects: [design, api], design: [figma, sketch] }` | ✅ history 플러그인 wired |
| `Enter` | TreeGrid: `design` 노드에 포커스 | — | `design` 다음에 새 형제 노드 생성 | `{ projects: [design, new, api] }` | ✅ crud 플러그인 wired |
| `Space` → `Space` → `Del` | 두 노드 선택 후 | 다중 선택 상태 | 선택된 노드들 일괄 삭제 (deleteMultiple) | 선택된 노드 + subtree 제거 | ✅ core(선택) + crud(삭제) wired |

### Clipboard 페이지

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 변경 없음 | — | — | — | — | ✅ 텍스트만 수정 |

텍스트에서 "Paste into a leaf node routes to the parent container automatically" 문장 제거. flat list 데모에서 체험 불가능하고, 이 동작은 Collection 레이어(TreeGrid, Kanban)에서 자연스럽게 체험됨 — "굳이" 판정.

### History 페이지

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `F2` | 5~7개 항목 ListBox, 노드에 포커스 | — | 인라인 rename 활성화 (contenteditable) | 편집 중 상태 | ✅ Aria.Editable 추가됨 |
| `Enter` (rename 중) | rename 활성 | — | rename 확정 | `{ label: '새 이름' }` | ✅ rename 플러그인 wired |
| `⌘Z` | rename 확정 직후 | — | 이전 label로 복원 | `{ label: '원래 이름' }` | ✅ history 플러그인 wired |

### 인터페이스 체크리스트

- [x] ↑↓: 변경 없음 (기존 플러그인)
- [x] ←→: CRUD가 TreeGrid로 바뀌므로 expand/collapse 자동 적용
- [x] Enter: CRUD=create, History=create (rename 중이면 confirm)
- [x] Escape: rename 취소
- [x] Space: 선택 토글
- [x] Tab: 위젯 밖으로 이동 (기존)
- [x] Home/End: 기존
- [x] ⌘Z/⌘⇧Z: 기존
- [x] F2: History에서 rename 시작 (신규 — Editable 추가)
- [x] 클릭: 기존
- [x] 이벤트 버블링: TreeGrid는 단일 `<Aria>` — 격리 불필요

상태: 🟢

## 3. 산출물

### 3.1 CRUD 페이지 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 데모 데이터 교체 | flat list → 2 depth tree. 예: `projects → [design → [figma, sketch], api → [rest, graphql]], docs → [readme, changelog]` | ✅ 정확히 일치 |
| UI 컴포넌트 교체 | `ListBox` → `TreeGrid` + tree 렌더링 (DnD 페이지 패턴 참고) | ✅ TreeGrid + indent/chevron |
| 텍스트 유지 | "deleted subtrees restore on undo" — 이제 데모가 증명 | ✅ 텍스트 유지 확인 |

### 3.2 History 페이지 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 데이터 확대 | 3개 → 6개 항목 | ✅ 6개 (Meeting notes, API design draft, Bug triage list, Sprint retrospective, Release checklist, Onboarding guide) |
| `<Aria.Editable>` 추가 | renderItem에 `<Aria.Editable field="label">` 래핑 (Rename 페이지 패턴 참고) | ✅ 정확히 일치 |
| 텍스트 유지 | "Try creating, deleting, renaming, or reordering" — 이제 전부 동작 | ✅ 텍스트 유지 확인 |

### 3.3 Clipboard 페이지 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| page-section 텍스트 수정 | "Paste into a leaf node routes to the parent container automatically" 문장 제거 | ✅ 정확히 일치 |

### 3.4 DnD, Rename 페이지

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 변경 없음 | 텍스트 ↔ 데모 일치 확인됨 | ✅ diff에 없음 |

### 3.5 수정 파일 목록

| 파일 | 유형 |
|------|------|
| `src/pages/PageCrud.tsx` | 수정 — TreeGrid + tree 데이터 |
| `src/pages/PageHistoryDemo.tsx` | 수정 — 데이터 확대 + Editable |
| `src/pages/PageClipboard.tsx` | 수정 — page-section 텍스트 1문장 제거 |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| CRUD: 리프 노드 삭제 | `{ design: [figma, sketch] }`, `sketch`에 포커스 | `sketch`만 삭제, `figma`로 포커스 복구 | `{ design: [figma] }` | ✅ 트리 데이터에 리프 존재 |
| CRUD: 루트 바로 밑 그룹 삭제 | `{ __root__: [projects, docs] }`, `projects`에 포커스 | `projects` + 모든 하위 삭제, `docs`로 포커스 | `{ __root__: [docs] }` | ✅ 역PRD: subtree 삭제 시나리오 확인 |
| CRUD: 마지막 노드 삭제 후 undo | 노드 1개 남은 상태에서 삭제 → undo | 빈 상태 → undo로 복원 | 원래 상태 | ✅ history wired (코드에서 파악 불가 표기했으나 플러그인 동작) |
| History: rename 중 Escape | rename 활성 | rename 취소, 원래 값 유지 | 변경 없음 | ✅ rename 플러그인 동작 |
| History: rename 후 undo | `{ label: '새 값' }` | `{ label: '원래 값' }` 복원 | 원래 값 | ✅ 역PRD에서 동일 시나리오 확인 |

⚠️ 역PRD 추가 경계: "TreeGrid에서 leaf 노드의 chevron이 빈 문자열" — PRD에 명시되지 않았으나 코드에서 `isGroup ? (expanded ? '▾' : '▸') : ''`로 구현됨. 정상 동작이며 PRD 누락은 아님 (UI 디테일).

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | 플러그인 코드(`src/interactive-os/plugins/`) 수정 | 쇼케이스는 기존 플러그인 재사용이 목적 | ✅ 준수 |
| 2 | 새 UI 컴포넌트 생성 | 기존 `TreeGrid`, `ListBox`, `<Aria.Editable>` 조합으로 충분 | ✅ 준수 |
| 3 | 페이지 구조 패턴 변경 (page-header → page-keys → card → page-section) | 전 페이지 일관성 유지 | ✅ 준수 |
| 4 | cut 상태 시각 피드백 추가 | → Phase 2. 플러그인이 cutIds를 UI에 노출해야 함 | ✅ 준수 |
| 5 | Clipboard 데이터를 tree로 변경 | → Phase 2. leaf→parent 라우팅 데모는 플러그인 개선 후에 의미 있음 | ✅ 준수 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | CRUD: 자식 있는 노드에서 `Del` → `⌘Z` | subtree 전체 삭제 후, undo로 원래 위치에 완전 복원 | ✅ 역PRD #2 일치 |
| 2 | CRUD: `Enter`로 생성 → 생성된 노드가 올바른 위치에 삽입 | 포커스 노드 바로 다음 형제로 삽입됨 | ✅ crud wired |
| 3 | CRUD: 다중 선택 → `Del` | 선택된 노드 전부 삭제 | ✅ core+crud wired |
| 4 | CRUD: `←` `→`로 expand/collapse | 트리 접기/펼치기 동작 | ✅ 역PRD #1 일치 |
| 5 | History: `F2` → 텍스트 수정 → `Enter` | rename 확정, 새 label 표시 | ✅ 역PRD #3 일치 |
| 6 | History: rename 후 `⌘Z` | 이전 label로 복원 | ✅ 역PRD #4 일치 |
| 7 | History: create → delete → rename → reorder → undo 4회 | 각 단계가 순서대로 되돌려짐 | ✅ 전 플러그인 wired |
| 8 | Clipboard: page-section에 "leaf node routes to parent" 문장 없음 | 텍스트에서 제거 확인 | ✅ 역PRD #5 일치 |
| 9 | 기존 테스트 전부 통과 | 플러그인 코드 미변경이므로 regression 없음 | ✅ 576 tests passed |
| 10 | CRUD 텍스트 "deleted subtrees restore on undo" → 실제로 체험 가능 | 텍스트가 약속한 것을 데모에서 확인 | ✅ TreeGrid + tree data |

⚠️ 역PRD 추가 검증: "CRUD 트리에서 indent 시각적 계층 표현 (group=bold 600, item=normal 400, depth별 18px)" — PRD에 명시되지 않았으나 구현됨. DnD 패턴 복제이므로 의도된 동작.

상태: 🟢

---

**전체 상태:** 🟢 6/6
