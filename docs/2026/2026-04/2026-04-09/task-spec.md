---
id: samples/task-spec
type: note
slug: taskSpec
title: 'TRD: 슬라이드 복제 기능'
tags: [samples]
created: 2026-04-09
updated: 2026-04-09
summary: '**요약**: 선택된 section(슬라이드)을 자식 노드 포함 deep copy하여 바로 아래에 삽입한다.'
legacy:
  status: sample
  kind: note
  topics: [samples]
  relates: []
  supersedes: []
---
# TRD: 슬라이드 복제 기능

**요약**: 선택된 section(슬라이드)을 자식 노드 포함 deep copy하여 바로 아래에 삽입한다.

---

## 선행 조건

- `cmsSchema.ts`의 `section` 노드 타입이 SSOT로 정의되어 있음
- `clipboardCommands.copy` + `paste`가 engine에 구현되어 있음 (clipboard plugin)
- `NormalizedData` 플랫 맵 구조에서 `addNode` / `addChild` command가 동작함

---

## Behavior

| # | Given | When | Then |
|---|-------|------|------|
| 1 | section `s1`이 선택됨 (자식: card×2, text×1) | `Cmd+D` (duplicate) | `s1` 바로 아래에 `s1-copy`가 삽입됨. 자식 3개도 새 ID로 deep copy |
| 2 | section `s1`이 선택됨 | duplicate 실행 | 포커스가 복제된 `s1-copy`로 이동 |
| 3 | 복제 직후 상태 | `Cmd+Z` (undo) | 복제된 section + 모든 자식이 한 번에 제거됨 |
| 4 | 루트에 section이 없음 (빈 상태) | `Cmd+D` | 아무 동작 없음 (no-op) |
| 5 | 다중 선택: `s1`, `s3` | `Cmd+D` | 각각의 바로 아래에 복제본 삽입, 순서 보존 |

---

## Schema

```
입력: DuplicateCommand { type: 'duplicate', targetIds: string[] }

Store 변화 (NormalizedData):
  1. targetId의 서브트리를 순회하여 모든 노드 수집
  2. 각 노드에 새 ID 발급 (crypto.randomUUID)
  3. data는 structuredClone으로 deep copy
  4. 부모의 children 배열에서 targetId 바로 뒤 인덱스에 복제 루트 삽입
  5. 모든 복제 노드를 nodes 맵에 추가

역연산: RemoveBatchCommand { type: 'removeBatch', nodeIds: string[] }
```

---

## 경계 조건

| 조건 | 기대 동작 |
|------|-----------|
| 깊이 3+ 중첩 (section > card > text) | 전체 서브트리 재귀 복제 |
| 자식이 0개인 빈 section | section 노드만 복제 |
| 복제 대상이 section이 아닌 leaf 노드 | 해당 노드만 단독 복제 |
| 동일 section을 연속 2회 복제 | 2개의 독립 복제본 생성, ID 모두 고유 |
| tab-group 내부 tab-item 복제 | tab-group의 children 순서에 맞게 삽입 |

---

## 검증 시나리오

```typescript
// 1. 기본 복제
it('section을 복제하면 자식 포함 deep copy된다', () => {
  engine.dispatch(commands.duplicate(['s1']))
  const roots = store.getState().rootIds
  expect(roots.indexOf(copyId)).toBe(roots.indexOf('s1') + 1)
  expect(getChildren(store.getState(), copyId)).toHaveLength(3)
})

// 2. ID 고유성
it('복제된 노드의 ID는 원본과 모두 다르다', () => {
  engine.dispatch(commands.duplicate(['s1']))
  const originalIds = collectSubtreeIds('s1')
  const copyIds = collectSubtreeIds(copyId)
  expect(originalIds).not.toEqual(expect.arrayContaining(copyIds))
})

// 3. Undo 원자성
it('undo 한 번으로 복제 전체가 롤백된다', () => {
  engine.dispatch(commands.duplicate(['s1']))
  engine.undo()
  expect(store.getState().rootIds).toEqual(originalRootIds)
})

// 4. 포커스 이동
it('복제 후 포커스가 새 노드로 이동한다', () => {
  engine.dispatch(commands.duplicate(['s1']))
  expect(engine.getFocusedId()).toBe(copyId)
})

// 5. 빈 선택 no-op
it('선택 없이 duplicate하면 상태 변화 없다', () => {
  engine.dispatch(commands.duplicate([]))
  expect(store.getState()).toEqual(stateBefore)
})
```

---

## 관련 코드

| 파일 | 역할 |
|------|------|
| `src/pages/cms/cmsSchema.ts` | section 노드 타입 정의 (SSOT) |
| `src/pages/cms/cmsStore.ts` | CMS 단일 store, 초기 데이터 |
| `src/interactive-os/store/createStore.ts` | addNode, addChild, removeNode 등 저수준 command |
| `src/interactive-os/engine/plugins/clipboard.ts` | copy/paste command 참조 구현 |
| `src/interactive-os/engine/createCommandEngine.ts` | command dispatch, undo/redo |
