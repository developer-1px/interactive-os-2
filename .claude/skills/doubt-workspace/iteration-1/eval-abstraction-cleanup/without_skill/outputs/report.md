# createStore.ts 추상화 분석 보고서

대상 파일: `src/interactive-os/core/createStore.ts` (126줄, 10개 exported 함수)

## 요약

- 제거 대상: 1개 (`insertNode`)
- 유지 대상: 9개 (모두 정당한 이유 있음)

---

## 함수별 판정

### 1. `insertNode` -- 제거

```ts
export function insertNode(
  store: NormalizedData, entity: Entity, parentId: string, index: number
): NormalizedData {
  return addEntity(store, entity, parentId, index)
}
```

**판정: 불필요한 래퍼. 제거하고 호출부를 `addEntity`로 대체해야 한다.**

- `addEntity`와 시그니처가 거의 동일하다 (`index`가 optional vs required인 차이뿐).
- 내부에서 `addEntity`를 그대로 위임한다 (로직 추가 없음).
- 코드베이스 검색 결과 **createStore.ts 내부 정의 외에 외부 사용처가 0건**이다.
- `addEntity`가 이미 `index?: number`를 받으므로 "인덱스 지정 삽입"이라는 의미적 구분도 불필요하다.

---

### 2. `getEntity` -- 유지

```ts
export function getEntity(store: NormalizedData, id: string): Entity | undefined {
  return store.entities[id]
}
```

**판정: 유지.**

1줄이지만 다음 이유로 유지가 정당하다:

- **사용처 20건 이상** (useAria, useAriaZone, useControlledAria, createBehaviorContext, focusRecovery, rename, clipboard, crud, Kanban UI 등).
- `BehaviorContext` 인터페이스(`types.ts:65`)가 `getEntity(id: string)` 메서드를 명세하고, `createBehaviorContext`가 이 함수를 위임한다. 즉 **인터페이스 계약의 일부**다.
- 접근 경로를 한 곳에 집중시켜, 향후 store 구조 변경(예: Map 전환, 역인덱스 추가) 시 수정 지점이 1곳이 된다.

### 3. `getChildren` -- 유지

```ts
export function getChildren(store: NormalizedData, parentId: string): string[] {
  return store.relationships[parentId] ?? []
}
```

**판정: 유지.**

- **사용처 60건 이상** -- 코드베이스에서 가장 많이 쓰이는 store 접근자.
- `?? []` fallback이 호출부마다 반복되는 것을 방지한다 (null-safety 보장).
- `BehaviorContext.getChildren` 인터페이스의 구현체.

### 4. `getParent` -- 유지

```ts
export function getParent(store: NormalizedData, nodeId: string): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  return undefined
}
```

**판정: 유지. 1-2줄 래퍼가 아니라 O(n*m) 순회 로직이다.**

- 역인덱스가 없는 현재 구조에서 부모를 찾는 유일한 방법.
- 사용처 25건 이상.
- TODO 주석이 있어 향후 최적화 시 이 함수만 교체하면 된다.

### 5. `addEntity` -- 유지

**판정: 유지. 중복 방지 + 인덱스 삽입 + 불변 갱신 로직이 있다.**

- `filter((id) => id !== entity.id)` 중복 방지 로직.
- `index` 기반 splice 로직.
- 사용처: crud, clipboard, 내부(`insertNode`).

### 6. `removeEntity` -- 유지

**판정: 유지. 재귀 하위 트리 수집 + 불변 갱신으로 가장 복잡한 함수(20줄).**

### 7. `updateEntity` -- 유지

**판정: 유지. 존재 확인 + 불변 갱신 + id 보호(`id: nodeId`).**

- `{ ...existing, ...updates, id: nodeId }`로 id 덮어쓰기를 방지하는 안전 장치가 있다.

### 8. `moveNode` -- 유지

**판정: 유지. 같은 부모/다른 부모 분기 처리가 있는 비자명한 로직(24줄).**

### 9. `getEntityData` -- 유지

```ts
export function getEntityData<T extends Record<string, unknown>>(
  store: NormalizedData, id: string
): T | undefined {
  return store.entities[id]?.data as T | undefined
}
```

**판정: 유지.**

- 제네릭 `T`로 타입 안전한 `data` 접근을 제공한다. `getEntity`만으로는 `data`의 타입을 좁힐 수 없다.
- 사용처: useAria, useAriaZone (followFocus 플래그 접근).

### 10. `updateEntityData` -- 유지

```ts
export function updateEntityData(
  store: NormalizedData, nodeId: string, updates: Record<string, unknown>
): NormalizedData {
  const existing = store.entities[nodeId]
  if (!existing) return store
  return {
    ...store,
    entities: {
      ...store.entities,
      [nodeId]: { ...existing, data: { ...existing.data, ...updates } },
    },
  }
}
```

**판정: 유지.**

- `updateEntity`와 달리 `data` 필드만 부분 갱신한다 (다른 entity 속성은 보존).
- 사용처: rename 플러그인.
- `updateEntity`로 대체하려면 호출부에서 `{ data: { ...existing.data, ...updates } }`를 매번 작성해야 해 오히려 번거롭다.

---

## 결론

| 함수 | 줄 수 | 사용처 | 판정 | 이유 |
|---|---|---|---|---|
| `createStore` | 5 | 다수 | 유지 | 팩토리, 기본값 설정 |
| `getEntity` | 1 | 20+ | 유지 | 인터페이스 계약, 변경 격리 |
| `getChildren` | 1 | 60+ | 유지 | null-safety, 인터페이스 계약 |
| `getParent` | 5 | 25+ | 유지 | 비자명한 순회 로직 |
| `addEntity` | 10 | 5 | 유지 | 중복 방지 + splice 로직 |
| `removeEntity` | 20 | 3 | 유지 | 재귀 하위 트리 삭제 |
| `updateEntity` | 7 | 사용처 미확인 | 유지 | id 보호 안전 장치 |
| `moveNode` | 24 | 2 | 유지 | 같은/다른 부모 분기 |
| **`insertNode`** | **3** | **0 (외부)** | **제거** | **addEntity의 순수 래퍼, 외부 사용처 없음** |
| `getEntityData` | 3 | 3 | 유지 | 제네릭 타입 안전성 |
| `updateEntityData` | 10 | 3 | 유지 | data 부분 갱신 편의 |

**이 파일에서 정리 가능한 불필요한 추상화는 `insertNode` 1건뿐이다.** 나머지 1-2줄 함수들(`getEntity`, `getChildren`, `getEntityData`)은 인터페이스 계약, null-safety, 타입 안전성, 변경 격리 등 정당한 존재 이유가 있다.
