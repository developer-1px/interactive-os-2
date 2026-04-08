# Writer Tree CRUD 완성 — PRD

> Discussion: 구조적 글쓰기 트리에서 문서를 온전히 만들고 수정할 수 있는 CRUD 조작 완성. OS 기반(keyMap + command + plugin).

## ① 동기

### WHY

- **Impact**: Writer Prototype은 기본 navigate/edit/insert/delete만 있어서, 아웃라이너로서 indent/outdent, 문장 분할/합치기, 타입 전환이 불가. 구조적 글쓰기 도구로 쓸 수 없음.
- **Forces**: OS에 dnd(moveIn/moveOut/moveTo), getVisibleNodes(shouldShow 필터), crud(create/delete)가 이미 있음. 단, rename에서 커서 위치(selectionStart) 미전달이라 split 구현에 gap 존재.
- **Decision**: writer 전용 조작은 writerKeys plugin에 집중. OS gap은 rename 커서 위치 전달 1건만. 기각: level 직접 편집(Mod+1~6) — 트리 깊이와 불일치 유발. paragraph 포커스 유지 — 글쓰기 흐름 끊김.
- **Non-Goals**: 협업 편집, WYSIWYG, 이미지/미디어 편집, auto-save.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | heading 포커스 | Tab | 이전 형제 heading의 자식으로 reparent, level 자동 파생 | ✅ `PageWriter.tsx::writerKeys` Tab → dndCommands.moveIn |
| S2 | heading 포커스 (document 직속 아님) | Shift+Tab | 부모의 형제로 reparent, level 자동 -1 | ✅ `PageWriter.tsx::writerKeys` Shift+Tab → dndCommands.moveOut |
| S3 | sentence 편집 중, 커서 중간 | Cmd+Enter | 커서 위치에서 content 분할 → 두 sentence | ✅ `PageWriter.tsx::writerEditKeyDown` Cmd+Enter → confirmRename + insertAfter |
| S4 | 빈 sentence 포커스 | Backspace | 노드 삭제 + 이전 sentence content에 합류 | ✅ `PageWriter.tsx::writerKeys` Backspace (empty) + `writerEditKeyDown` Backspace@0 |
| S5 | heading 포커스, 비편집 | Cmd+Enter | 같은 level 빈 heading 삽입 + 편집 진입 | ✅ `PageWriter.tsx::writerKeys` Mod+Enter → crud.create + startRename |
| S6 | heading 포커스 | Cmd+Shift+Enter | 첫 자식 sentence 삽입 + 편집 진입 | ✅ `PageWriter.tsx::writerKeys` Mod+Shift+Enter → crud.create(ctx.focused, 0) |
| S7 | sentence 여러 개 선택 | Mod+L | list > listItem으로 wrap | ✅ `PageWriter.tsx::writerCommands.wrapInList` |
| S8 | listItem 포커스 (list 안) | Mod+Shift+L | list unwrap → 부모의 형제로 | ✅ `PageWriter.tsx::writerCommands.unwrapFromList` |
| S9 | heading 포커스 | Mod+0 | heading → paragraph 전환, 자식들 부모 형제로 올라감 | ✅ `PageWriter.tsx::writerCommands.convertType` |
| S10 | 트리 navigate | ↑↓ | paragraph/list 컨테이너 skip, heading/sentence/listItem/hr만 포커스 | ✅ `PageWriter.tsx::writerNavigateFilter` + `getVisibleNodes.ts::isFocusable` |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `writerKeys` plugin 확장 (`PageWriter.tsx`) | indent/outdent/split/merge/자식삽입/wrap/unwrap/타입전환 keyMap 추가 | ✅ `PageWriter.tsx::writerKeys` |
| `writerNavigateFilter` (`PageWriter.tsx`) | `shouldShow` 필터 — paragraph/list/document skip | 🔀 `isFocusable` 필터로 구현 (shouldShow는 자식도 skip하므로 부적합) |
| `rename` plugin 확장 (`plugins/rename.ts`) | `confirmRename`에 optional `cursorPosition` 전달 | 🔀 rename 미수정 — `Aria.Editable::editKeyDown` prop으로 대체. 커서 위치를 DOM에서 직접 캡처 |
| `Aria.Editable` 확장 (`primitives/aria.tsx`) | split 시 selectionStart를 command에 실어주는 경로 | ✅ `aria.tsx::EditKeyContext`, `editKeyDown` prop |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓ | 포커스 있음 | 이전/다음 focusable 노드 이동 | DFS순 shouldShow 필터로 컨테이너 skip | 포커스 이동 | ✅ isFocusable 필터 |
| ←→ | heading 포커스 | collapse/expand | expand axis 기본 동작 | 자식 숨김/표시 | ✅ 기존 동작 유지 |
| Enter | 비편집 | 인라인 편집 진입 | rename plugin 기본 | 편집 상태 | ✅ writerKeys Enter |
| Enter | 편집 중 | 편집 확정 | rename confirm | 비편집 | ✅ Aria.Editable 기존 동작 |
| Escape | 편집 중 | 편집 취소 | dismiss axis | 편집 전 복원 | ✅ Aria.Editable 기존 동작 |
| Tab | 포커스 있음 | indent — dnd.moveIn | 이전 형제 아래로 reparent. heading level은 트리 깊이 파생 | 트리 구조 변경 | ✅ writerKeys Tab |
| Shift+Tab | 포커스 있음 | outdent — dnd.moveOut | 부모의 형제로 reparent. document 직속이면 무시 | 트리 구조 변경 | ✅ writerKeys Shift+Tab |
| Cmd+Enter | 비편집 | 같은 타입 빈 형제 삽입 + 편집 진입 | crud.create + rename.start | 새 노드 + 편집 | ✅ writerKeys Mod+Enter |
| Cmd+Enter | 편집 중 | 커서 위치에서 split | selectionStart로 content 분할 → 원본 + 새 노드 | 두 노드 + 새 노드 편집 | ✅ writerEditKeyDown |
| Cmd+Shift+Enter | heading 포커스 | 첫 자식 sentence 삽입 + 편집 | heading 아래 content 추가가 자식 삽입 | 새 sentence + 편집 | ✅ writerKeys Mod+Shift+Enter |
| Backspace | 빈 노드, 비편집 | 삭제 + 이전 visible 노드 포커스 | 빈 노드는 의미 없음 | 노드 삭제 | ✅ writerKeys Backspace |
| Backspace | 편집 중, 커서 맨 앞 | 이전 visible 노드에 merge | content 시작에서 더 지울 게 없으면 합류 | 합친 content | ✅ writerEditKeyDown Backspace@0 |
| Backspace | 편집 중, 커서 중간 | 일반 텍스트 삭제 | 기본 input 동작 | 텍스트 변경 | ✅ editKeyDown returns void → fall-through |
| Delete | 비편집 | 노드 삭제 | crud.delete 기본 | 노드 삭제 | ✅ crud plugin 기존 |
| Alt+↑↓ | 포커스 있음 | 순서 이동 | dnd.moveUp/moveDown (서브트리 통째) | 순서 변경 | ✅ writerKeys Alt+Arrow |
| Mod+L | 포커스/선택 | list wrap | 선택 노드 → list > listItem 감싸기 | wrap된 구조 | ✅ writerKeys Mod+l |
| Mod+Shift+L | listItem 포커스 | list unwrap | dnd.moveOut + 빈 list 삭제 | flat 구조 | ✅ writerKeys Mod+Shift+l |
| Mod+0 | heading 포커스 | heading → paragraph | 구조→내용 강등. 자식은 부모 형제로 올라감 | 타입 변경 | ✅ writerKeys Mod+Digit0 |
| Mod+Shift+H | paragraph 포커스 | paragraph → heading | 내용→구조 승격. level은 트리 깊이 파생 | 타입 변경 | ✅ writerKeys Mod+Shift+h |
| Mod+Z / Mod+Shift+Z | 언제든 | undo / redo | history plugin | 상태 복원 | ✅ 기존 history plugin |
| Mod+S | 언제든 | 저장 | 기존 AriaRoute keyMap | 파일 저장 | ✅ 기존 writerKeyMap |
| Space | 편집 중 | 공백 입력 | 기본 input | 텍스트 변경 | ✅ 기존 contentEditable |
| Home/End | 포커스 있음 | 첫/마지막 focusable 노드 | navigate focusFirst/focusLast | 포커스 이동 | ✅ 기존 navigate axis |
| 클릭 | 노드 위 | 포커스 + 선택 | 기존 treegrid 클릭 | 포커스 이동 | ✅ 기존 TreeGrid |

## 인터페이스 체크리스트

- [x] ↑↓: navigate + skip filter
- [x] ←→: expand/collapse
- [x] Enter: 편집 진입/확정
- [x] Escape: 편집 취소
- [x] Space: 텍스트 입력
- [x] Tab: indent/outdent
- [x] Home/End: 첫/마지막 노드
- [x] Cmd 조합: split, 자식삽입, wrap, unwrap, 타입전환, save, undo/redo
- [x] 클릭: 포커스+선택
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: SplitPane 분리

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| document 직속 heading Shift+Tab | 최상위 | document 밖으로 나갈 수 없음 | 무시 | 변화 없음 | ✅ dndCommands.moveOut 가드 |
| 이전 형제 없는 노드 Tab | 첫 자식 | reparent 대상 없음 | 무시 | 변화 없음 | ✅ dndCommands.moveIn 가드 |
| h6에서 Tab | 깊이 6 | MD 최대 heading depth | reparent 수행, level=6 cap | 트리 변경, level 고정 | ✅ writerTransform.ts Math.min(headingDepth, 6) |
| 커서 맨 끝 split | content 끝 | 뒤쪽 빈 문자열 | 빈 새 노드 생성 + 편집 (=형제 삽입과 동일) | 새 빈 노드 | ✅ insertAfter({ content: '' }) |
| 커서 맨 앞 split | content 시작 | 앞쪽 빈 문자열 | 원본 빈 content, 새 노드에 전체 content | 빈 원본 + content 노드 | ✅ confirmRename('') + insertAfter(전체) |
| 빈 노드 Backspace merge | 이전 노드 존재 | 합칠 content 없음 | 삭제만, 이전 노드 포커스 | 노드 삭제 | ✅ writerKeys Backspace empty 분기 |
| 첫 focusable 노드 Backspace | 이전 visible 없음 | 합칠 대상 없음 | 무시 | 변화 없음 | ✅ getPrevVisibleNode returns undefined |
| 자식 없는 heading collapse | 잎 heading | collapse 의미 없음 | 부모로 포커스 이동 (expand axis 기본) | 포커스 이동 | ✅ 기존 expand axis |
| heading→paragraph 자식 있음 | 자식 3개 | 구조 노드 사라지면 자식 고아 | 자식을 heading 부모에 삽입 + heading→paragraph | 자식 올라감 | ✅ convertType handler |
| 마지막 listItem unwrap | list에 1개 | 빈 list 남음 | unwrap + 빈 list 자동 삭제 | list 제거 | ✅ unwrapFromList handler |
| 혼합 선택 wrap | heading+sentence | heading을 listItem으로 감싸면 구조 붕괴 | heading 제외, sentence만 wrap | 부분 wrap | ✅ wrapInList handler `if (d?.type === 'heading') continue` |
| hr Enter | content 없음 | 편집할 것 없음 | 무시 | 변화 없음 | ✅ writerKeys Enter `if (d?.type === 'hr') return undefined` |
| heading split | heading 편집 중 | 구조 분기 | 뒤쪽 새 heading, 자식 원본 잔류 | 새 heading 빈 구조 | ✅ insertAfter creates sibling, not child |
| split 결과 타입 | sentence split | 타입 일관성 | 두 노드 모두 원본과 같은 타입 | 타입 보존 | ✅ insertAfter({ type, content: secondHalf }) |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태는 NormalizedData+Command (feedback) | 전 조작 | 준수 | — | ✅ defineCommands 사용 |
| 2 | UI는 ui/ 완성품, primitives 직접 사용 금지 (CLAUDE.md) | TreeGrid | 준수 | — | ✅ TreeGrid ui/ 완성품 |
| 3 | KeyMap 선언, addEventListener 금지 (CLAUDE.md) | writerKeys | 준수 | — | ✅ definePlugin keyMap |
| 4 | 선언=등록, 합성 런타임 불변 (feedback) | definePlugin 기반 | 준수 | — | ✅ |
| 5 | heading level = 트리 깊이 파생 (discuss) | indent/outdent | 준수 | — | ✅ writerTransform headingDepth |
| 6 | 컨테이너 navigate skip (discuss) | shouldShow 필터 | 준수 | — | 🔀 isFocusable로 구현 (shouldShow 대신) |
| 7 | Plugin은 keyMap 소유 (feedback) | writerKeys | 준수 | — | ✅ |
| 8 | expand/collapse = view state (feedback) | ←→ | 준수 | — | ✅ |
| 9 | defaultPrevented 범용 가드 (feedback) | 이벤트 | 준수 | — | ✅ |
| 10 | rename 확장 하위호환 | cursorPosition | 준수 — optional param | — | 🔀 rename 미수정, editKeyDown 대체 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | rename plugin (confirmRename 시그니처) | cursorPosition optional 추가 | 낮 | optional param, 하위호환 | 🔀 rename 미수정 — editKeyDown으로 대체, 부작용 없음 |
| 2 | Aria.Editable (aria.tsx) | split 시 selectionStart 전달 경로 | 낮 | 기존 동작 불변, 새 콜백 추가 | ✅ editKeyDown optional prop |
| 3 | writerKeys plugin keyMap 확장 | Mod+Enter 편집 중 동작 변경 | 중 | 비편집=형제삽입(기존), 편집=split(신규) | ✅ editKeyDown이 편집 중 처리, keyMap은 비편집 |
| 4 | navigate 필터로 paragraph/list 포커스 불가 | 해당 노드 직접 조작 불가 | 중 | ←로 부모 이동, heading에서 Mod+0 접근 | ✅ isFocusable 필터 |
| ⚠️ | getVisibleNodes 분기 로직 변경 | hasFocusableFilter 조건 추가 | 중 | hasFocusableFilter=false 시 기존 동작 동일 | ✅ 기존 테스트 전체 통과 |
| ⚠️ | writerTransform heading level 도출 변경 | data.level 대신 트리 깊이 사용 | 중 | 기존 writer-transform.test.ts 통과 | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | heading level 직접 수정 (Mod+1~6) | ⑤#5 | 트리 깊이와 불일치 유발 | ✅ 미구현 |
| 2 | useState로 편집 상태 관리 | ⑤#1 | NormalizedData+Command 원칙 | ✅ rename plugin 사용 |
| 3 | addEventListener로 키 바인딩 | ⑤#3 | keyMap 선언 원칙 | ✅ definePlugin keyMap |
| 4 | paragraph/list 포커스 허용 | ⑤#6 | 컨테이너 skip 원칙 | ✅ isFocusable 필터 |
| 5 | confirmRename breaking change | ⑥#1 | optional param만 추가 | ✅ rename 미수정 |
| 6 | heading split 시 자식을 새 heading으로 이동 | ④ 경계 | 자식은 원본에 잔류 | ✅ insertAfter creates sibling |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | heading Tab → indent | 이전 형제 heading 자식으로, storeToMd level +1 | ✅ `writer-crud.test.ts::indent moves heading under previous sibling heading` |
| V2 | ①S2 | heading Shift+Tab → outdent | 부모의 형제로, level -1 | ✅ `writer-crud.test.ts::outdent moves heading to grandparent` |
| V3 | ①S3 | sentence 편집 중 커서 중간 Cmd+Enter | content 분할, 새 sentence | ✅ `writer-crud.test.ts::splits sentence content at cursor position` |
| V4 | ①S4 | 빈 sentence Backspace | 삭제 + 이전 sentence 포커스 | ✅ `writer-crud.test.ts::merges empty node into previous` |
| V5 | ①S5 | heading 비편집 Cmd+Enter | 빈 heading 삽입 + 편집 | ✅ `writer-crud.test.ts::inserts sibling heading with same level` |
| V6 | ①S6 | heading Cmd+Shift+Enter | 첫 자식 sentence + 편집 | ✅ `writer-crud.test.ts::inserts first child sentence under heading` |
| V7 | ①S7 | 여러 sentence Mod+L | list > listItem wrap | ✅ `writer-crud.test.ts::wraps sentences into list > listItem` |
| V8 | ①S8 | listItem Mod+Shift+L | unwrap, 빈 list 삭제 | ✅ `writer-crud.test.ts::unwraps listItem and removes empty list` |
| V9 | ①S9 | heading Mod+0 | paragraph 전환, 자식 올라감 | ✅ `writer-crud.test.ts::converts heading to paragraph, children reparented` |
| V10 | ①S10 | ↑↓ navigate | paragraph/list skip | ✅ `writer-crud.test.ts::skips paragraph/list/document, shows heading/sentence/listItem/hr` |
| V11 | ④ | document 직속 Shift+Tab | 무시 | ✅ `writer-crud.test.ts::outdent at document level is no-op` |
| V12 | ④ | h6 Tab | reparent, level=6 cap | ✅ `writer-crud.test.ts::h6 indent still reparents but level caps at 6` |
| V13 | ④ | 커서 끝 split | 빈 새 노드 | ✅ `writer-crud.test.ts::split at end creates empty new node` |
| V14 | ④ | 첫 노드 Backspace | 무시 | ✅ `writer-crud.test.ts::first visible node merge is no-op` |
| V15 | ④ | 마지막 listItem unwrap | unwrap + list 삭제 | ✅ V8 테스트에서 커버 |
| V16 | ④ | heading split | 새 heading, 자식 원본 잔류 | ✅ `writer-crud.test.ts::heading split keeps children with original` |
| V17 | ④ | 혼합 선택 wrap | heading 제외, sentence만 wrap | ✅ `writer-crud.test.ts::does not convert headings to listItem when wrapping` |
| V18 | ④ | hr Enter | 무시 | ✅ `writer-crud.test.ts::hr has no content field` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
