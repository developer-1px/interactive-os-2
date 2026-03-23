# /doubt 결과 (2라운드 수렴)

**대상**: `/Users/user/Desktop/aria/src/interactive-os/core/createStore.ts`
**요청**: "1-2줄짜리 래퍼 함수가 불필요한 추상화인지 정리해줘"

> 연구 전용 실행 — 파일 수정 없음, 분석 보고만 수행.

---

## 라운드 요약

| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 1      | 0      | 0         | No   |
| 2     | 0      | 0      | 0         | Yes  |

---

## Step 1: 목록화

| # | 함수 | 줄 수 | 역할 |
|---|------|-------|------|
| 1 | `createStore` | 5 | NormalizedData 초기 상태 생성, ROOT_ID 기본 관계 포함 |
| 2 | `getEntity` | 1 | `store.entities[id]` 접근 래퍼 |
| 3 | `getChildren` | 1 | `store.relationships[parentId] ?? []` 접근 래퍼 (nil-safe) |
| 4 | `getParent` | 5 | 역방향 탐색: 자식 → 부모 (O(n*m) 선형 검색) |
| 5 | `addEntity` | 12 | 엔티티 추가 + 관계 배열에 삽입 (중복 방지 포함) |
| 6 | `removeEntity` | 21 | 재귀적 삭제: 자손 수집 → entities/relationships 정리 |
| 7 | `updateEntity` | 9 | 엔티티 필드 부분 업데이트 (불변) |
| 8 | `moveNode` | 24 | 노드 이동: 이전 부모에서 제거 → 새 부모에 삽입 (같은 부모 내 이동 처리 포함) |
| 9 | `insertNode` | 3 | `addEntity`를 그대로 호출하는 1줄 래퍼 |
| 10 | `getEntityData<T>` | 2 | `entity.data`를 제네릭 타입으로 캐스팅하여 반환 |
| 11 | `updateEntityData` | 12 | `entity.data` 필드만 부분 병합 (불변) |

---

## Step 2: 필터 체인

### 1. `createStore` — ① 쓸모가 있나? Yes → ② 형태가 맞나? Yes → ③ 줄일 수 있나? No → **🟢 유지**
- 팩토리 함수. ROOT_ID 초기화 로직을 캡슐화. 존재 이유 명확.

### 2. `getEntity` — ① Yes → ② Yes → ③ 줄일 수 있나? No → ④ 더 적게? 의심 →
- **1줄 래퍼**: `return store.entities[id]`
- 호출처: useAria, useAriaZone, useControlledAria, createBehaviorContext, focusRecovery, rename, clipboard, crud, 테스트 — **9개 모듈**
- **Chesterton's Fence**: 왜 만들었는가?
  - NormalizedData의 내부 구조(`entities` 딕셔너리)를 캡슐화. store 구조가 바뀌면 (예: reverse index 추가, Map 전환) 이 함수 하나만 수정하면 됨.
  - createBehaviorContext에서 `ctx.getEntity()`로 재노출 — behavior 레이어가 store 구조를 모르게 하는 추상화 경계.
  - 이유가 아직 유효한가? → **Yes** (TODO 주석에 reverse index 가능성 언급, store 구조 변경 여지 있음)
- **판정: 🟢 유지**

### 3. `getChildren` — ① Yes → ② Yes → ③ No → ④ 의심 →
- **1줄 래퍼**: `return store.relationships[parentId] ?? []`
- 호출처: useAria, useAriaZone, useSpatialNav, useControlledAria, createBehaviorContext, focusRecovery, crud, clipboard, dnd, cms-schema, 내부(addEntity, removeEntity, moveNode) — **13개 모듈**
- **Chesterton's Fence**: `?? []` nil-safe 보장이 핵심. 직접 접근하면 매 호출처에서 `?? []`를 반복해야 함. store 구조 변경 시 단일 수정점.
- **판정: 🟢 유지**

### 4. `getParent` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 5줄이지만 래퍼가 아닌 실질 로직 (역방향 선형 탐색). 호출처 11개. 향후 reverse index로 교체할 단일 수정점.

### 5. `addEntity` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 12줄의 실질 로직. 중복 방지 + 인덱스 삽입. crud, clipboard 플러그인의 핵심 primitive.

### 6. `removeEntity` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 21줄 재귀 삭제 로직. 래퍼가 아닌 핵심 연산.

### 7. `updateEntity` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 9줄. 불변 업데이트 + 존재 검증 + id 보호(`id: nodeId`로 덮어쓰기 방지).

### 8. `moveNode` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 24줄. 같은 부모 내 이동과 다른 부모 간 이동을 모두 처리하는 복잡한 로직.

### 9. `insertNode` — ① 쓸모가 있나? **의심** →
- **1줄 래퍼**: `return addEntity(store, entity, parentId, index)`
- `addEntity`와 시그니처 차이: `index`가 required vs optional. 그 외 동일.
- **호출처 검색 결과**: createStore.ts 내부 정의만. **외부 호출처 0개**.
- **Lean 분류**: 과잉생산 (아무도 안 쓰는데 미리 만들었음)
- **Chesterton's Fence**: 왜 만들었는가?
  - git log: 최초 커밋(`b51f8ab`)에서 addEntity와 함께 도입. "insert at specific index"라는 의미적 구분을 의도한 것으로 보임.
  - 이유가 아직 유효한가? → **No**. addEntity가 이미 `index?` 파라미터를 받으므로 의미적 구분이 실질적 차이를 만들지 않음. 외부 호출처가 0개이므로 "의미적 별칭"으로서도 사용되지 않음.
- **판정: 🔴 제거 후보**

### 10. `getEntityData<T>` — ① Yes → ② Yes → ③ No → ④ 의심 →
- **2줄 래퍼**: `return store.entities[id]?.data as T | undefined`
- 호출처: useAria(1), useAriaZone(1) — **2개 모듈**
- **Chesterton's Fence**: 왜 만들었는가?
  - `Entity.data`는 `Record<string, unknown>` 타입. 이 함수는 제네릭 `T`로 타입 캐스팅하여 호출처에서 타입 안전 접근을 제공.
  - optional chaining (`entities[id]?.data`)을 캡슐화하여 호출처에서 null 체크 중복 방지.
  - 이유가 아직 유효한가? → **Yes**. 타입 캐스팅 로직을 매 호출처에서 반복하면 `as T` 산재 + entity 존재 검증 누락 위험.
- **판정: 🟢 유지**

### 11. `updateEntityData` — ① Yes → ② Yes → ③ No → **🟢 유지**
- 12줄. `updateEntity`와 다른 역할: entity 전체가 아닌 `data` 필드만 부분 병합. rename 플러그인에서 2회 사용. 불변 업데이트의 깊이가 한 단계 더 깊음(`entity.data` 내부 merge).

---

## Step 3: Chesterton's Fence 결과 요약

| 함수 | 왜 만들었나 | 이유 유효? | 판정 |
|------|------------|-----------|------|
| `getEntity` | store 구조 캡슐화, behavior 레이어 추상화 경계 | Yes | 🟢 |
| `getChildren` | nil-safe + store 구조 캡슐화 | Yes | 🟢 |
| `insertNode` | addEntity의 "index 필수" 의미적 별칭 | No — 외부 호출 0, addEntity가 이미 동일 기능 제공 | 🔴 |
| `getEntityData` | 제네릭 타입 캐스팅 + optional chaining 캡슐화 | Yes | 🟢 |

---

## Round 1 실행 (분석만)

- **🔴 `insertNode` 제거**: 외부 호출처 0개. `addEntity(store, entity, parentId, index)`로 완전 대체 가능. 삭제해도 기존 코드에 영향 없음.

## Round 2

Round 1에서 `insertNode` 제거 후 남은 10개 항목 재검토 → 전체 🟢. 수렴.

---

## 🔴 제거 (총 1건)

- **`insertNode`** (L101-105): 외부 호출처 0개. `addEntity`의 순수 래퍼로, index 파라미터가 required라는 시그니처 차이만 존재하나 이를 활용하는 코드가 없음. Lean 분류: 과잉생산. (Round 1)

## 🟡 축소/병합 (총 0건)

없음.

## 🟢 유지 (10건)

| 함수 | 존재 이유 |
|------|----------|
| `createStore` | 팩토리 — ROOT_ID 초기화 캡슐화 |
| `getEntity` | store 내부 구조 캡슐화 (9개 모듈 사용), behavior 추상화 경계 |
| `getChildren` | nil-safe 접근 캡슐화 (13개 모듈 사용), store 구조 변경 단일 수정점 |
| `getParent` | 역방향 탐색 로직 (11개 모듈), 향후 reverse index 교체 준비점 |
| `addEntity` | 중복 방지 + 인덱스 삽입 로직 |
| `removeEntity` | 재귀적 자손 수집 + 정리 로직 |
| `updateEntity` | 불변 업데이트 + id 보호 |
| `moveNode` | 같은/다른 부모 이동 분기 처리 |
| `getEntityData<T>` | 제네릭 타입 캐스팅 캡슐화 (2개 모듈) |
| `updateEntityData` | data 필드 깊은 부분 병합 (rename 플러그인) |

---

## 📊 Before → After (누적)

- 함수 수: 11 → 10 (-1)
- 제거 대상은 외부 호출처 0개인 dead code 1건뿐

---

## 핵심 판단 근거

사용자의 직관 — "1-2줄 래퍼가 불필요하다" — 에 대한 반론:

1. **`getEntity`, `getChildren`은 래퍼가 아니라 추상화 경계다.** NormalizedData의 내부 구조(`entities` 딕셔너리, `relationships` 딕셔너리)를 소비자로부터 숨긴다. store 구조가 변경되면 (TODO에 reverse index 언급) 이 함수들이 단일 수정점 역할을 한다. 9~13개 모듈이 의존하므로 인라인 시 변경 전파 비용이 크다.

2. **`getEntityData<T>`는 타입 안전성을 제공한다.** 단순 property 접근이 아니라 `as T` 캐스팅 + optional chaining을 캡슐화하여 호출처에서 타입 단언 반복을 방지한다.

3. **`insertNode`만이 진짜 불필요하다.** 외부 호출처 0개, addEntity와 기능적으로 동일, 의미적 구분도 활용되지 않음.
