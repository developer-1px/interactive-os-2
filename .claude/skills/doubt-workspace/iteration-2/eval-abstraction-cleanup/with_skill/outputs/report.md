# /doubt 결과

**대상**: `src/interactive-os/core/createStore.ts` (126줄, 11개 export 함수)
**모드**: 정리 요청 — 필터 체인 직행

---

## 1. 목록화

| # | 함수 | 줄 수 | 역할 |
|---|------|-------|------|
| 1 | `createStore` | 6 | NormalizedData 초기값 생성, ROOT_ID 관계 보장 |
| 2 | `getEntity` | 3 | store에서 id로 Entity 조회 (undefined 가능) |
| 3 | `getChildren` | 3 | parentId의 자식 id 배열 반환, 없으면 빈 배열 |
| 4 | `getParent` | 6 | 역방향 탐색으로 부모 id 반환 (O(n*m)) |
| 5 | `addEntity` | 13 | 엔티티 추가 + 관계 배열에 삽입 (중복 방지, index 지원) |
| 6 | `removeEntity` | 22 | 재귀적 서브트리 삭제 (entities + relationships 정리) |
| 7 | `updateEntity` | 10 | 엔티티 필드 부분 업데이트 (불변, id 보호) |
| 8 | `moveNode` | 24 | 노드 재배치 (같은 부모 내 이동 / 다른 부모로 이동) |
| 9 | `insertNode` | 4 | `addEntity(store, entity, parentId, index)` 호출만 하는 1줄 래퍼 |
| 10 | `getEntityData` | 4 | `entity.data`를 제네릭 타입으로 캐스팅 반환 |
| 11 | `updateEntityData` | 13 | `entity.data` 필드만 부분 병합 (불변) |

---

## 2. 필터 체인

### 1. `createStore` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 팩토리 함수. ROOT_ID 관계 초기화를 보장. 호출처 50+개 (모든 페이지, 테스트).

### 2. `getEntity` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 1줄이지만 `store.entities[id]`의 인터페이스 계약. 호출처 15+개. `BehaviorContext.getEntity()`로 위임. store 내부 구조(`entities` 키)를 캡슐화.

### 3. `getChildren` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 1줄이지만 `?? []` null-safety 보장. 호출처 70+개 (가장 많이 사용). `BehaviorContext.getChildren()`로 위임. store 내부 구조(`relationships` 키) 캡슐화.

### 4. `getParent` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 역방향 탐색 로직. 호출처 20+개. O(n*m) TODO 주석이 있어 향후 reverse index 최적화 시 이 함수만 수정하면 됨. 변경 격리의 교과서적 사례.

### 5. `addEntity` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 13줄. 중복 방지 로직 + index 기반 삽입. crud, clipboard 플러그인에서 직접 사용. `insertNode`이 위임하는 대상.

### 6. `removeEntity` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 22줄. 재귀 서브트리 수집 + entities/relationships 정리. crud, clipboard에서 사용. 비자명한 로직.

### 7. `updateEntity` — (1) **의심** -> 조사 필요
- 10줄. `id` 보호(덮어쓰기 방지) 안전장치 포함. **그러나 외부 호출처가 0개.** `PageStoreOperations.tsx`에서 라벨 텍스트로 언급만 됨 (문자열 리터럴). 실제 import/사용 없음. `rename.ts`도 `updateEntityData`를 사용하지 `updateEntity`는 사용하지 않음.
- **(2) 형태가 맞나?** -> `updateEntityData`가 도입되면서 역할이 대체됨. Entity 구조에서 `data` 외의 최상위 필드를 업데이트하는 케이스가 실제로 없음.
- Lean 분류: **재고** (만들어 놓고 쌓여만 있음)

### 8. `moveNode` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 24줄. 같은 부모/다른 부모 분기 로직. dnd 플러그인에서 5+회 사용. 비자명한 로직.

### 9. `insertNode` — (1) **아니오** -> **제거 후보**
- 4줄. `addEntity`를 그대로 호출하는 순수 래퍼. 시그니처 차이: `index`가 required (`addEntity`에서는 optional). **외부 호출처 0개.** 어디에서도 import하지 않음.
- Lean 분류: **과잉생산** (미리 만들어 놓았으나 사용되지 않음)

### 10. `getEntityData` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 4줄. 타입 캐스팅 + optional chaining. `useAria`, `useAriaZone`에서 `followFocus` 플래그 조회 시 사용. 제네릭 `<T>` 타입 안전성 제공.

### 11. `updateEntityData` — (1) Yes -> (2) Yes -> (3) No -> **유지**
- 13줄. `entity.data` 내부만 부분 병합. `rename.ts`에서 2회 사용 (rename + undo). `updateEntity`와 다른 깊이의 merge.

---

## 3. Chesterton's Fence

### `insertNode` (제거 후보)

**왜 만들었는지 아는가?** -> Yes.
- `docs/superpowers/plans/2026-03-16-interactive-os-phase1.md`에 Phase 1 계획에 포함. 초기 설계 시 "addEntity와 별도로 index가 필수인 insert 시맨틱"을 구분하려 했음.

**그 이유가 아직 유효한가?** -> **No.**
- 외부 호출처 0개. `addEntity`가 이미 optional index를 지원하므로 시맨틱 구분의 실익 없음. crud 플러그인도 `addEntity`를 직접 사용. 이 함수가 존재한다는 것을 아는 소비자가 없음.
- -> **제거 확정**

### `updateEntity` (의심 후보)

**왜 만들었는지 아는가?** -> Yes.
- Phase 1에서 Entity의 root-level 필드(`name` 등) 업데이트용으로 설계. Phase 3에서 `Entity<T>` 제네릭 도입 시 `data` 필드로 사용자 데이터가 이동하면서 `updateEntityData`가 추가됨.

**그 이유가 아직 유효한가?** -> **부분적.**
- 현재 `Entity`의 root-level 필드는 `id`와 `[key: string]: unknown` 뿐. `data` 외 root-level 필드를 업데이트하는 실제 사용 사례가 코드베이스에 없음.
- 그러나 `Entity` 인터페이스가 `[key: string]: unknown`을 허용하므로 향후 메타 필드 (예: `disabled`, `hidden`) 추가 시 필요할 수 있음.
- `PageStoreOperations.tsx`에서 공개 API 문서에 포함됨 (라벨 텍스트).
- -> **축소 후보 (유보적 유지)**: 현재 사용처 0개이나, 공개 API 계약의 일부로 문서화되어 있고 향후 확장 가능성 존재. 즉시 삭제보다는 "사용처 0" 상태를 인지하고 다음 정리에서 재평가 권고.

---

## 변경

| 항목 | 판정 | 이유 | 검증 |
|------|------|------|------|
| `insertNode` (L101-105) | 제거 | 외부 호출처 0개. `addEntity(store, entity, parentId, index)`로 완전 대체 가능. Lean: 과잉생산. | 확정 -- 삭제해도 컴파일/런타임 영향 없음 |
| `updateEntity` (L64-73) | 유보적 유지 | 외부 호출처 0개이나 공개 API 문서에 포함. 향후 meta 필드 추가 시 필요 가능성. 다음 정리에서 재평가. | -- |

## 유지 (9건)

- **팩토리**: 1건 (`createStore`) -- 모든 소비자의 진입점
- **조회 (getter)**: 4건 (`getEntity`, `getChildren`, `getParent`, `getEntityData`) -- store 내부 구조 캡슐화, null-safety, 타입 안전성, 변경 격리
- **변경 (mutation)**: 4건 (`addEntity`, `removeEntity`, `updateEntityData`, `moveNode`) -- 비자명한 불변 업데이트 로직, 각각 고유한 역할

## Before -> After

- 항목 수: 11 -> 10 (-1 확정, 1 유보적 감시)
- 줄 수: 126 -> ~121 (-5, `insertNode` 제거 시)

---

## 분석 요약

1. **`insertNode`은 명확한 제거 대상이다.** 외부 호출처 0개, `addEntity`의 순수 래퍼, 시그니처 차이(index required)도 활용하는 코드 없음.

2. **`updateEntity`는 "사용처 0" 경고 상태.** 현재 모든 데이터 업데이트가 `updateEntityData`를 통해 이루어지고 있어, root-level merge가 실제로 필요한 사례가 등장하지 않으면 다음 정리에서 제거 후보가 됨.

3. **나머지 9개 함수는 모두 정당한 존재 이유가 있다.** 1-2줄짜리 `getEntity`, `getChildren` 같은 함수도 (a) store 내부 구조 캡슐화, (b) null-safety(`?? []`), (c) BehaviorContext 인터페이스 위임 대상, (d) 향후 최적화 격리(`getParent`의 reverse index) 등 뺄 수 없는 이유가 존재한다. "짧다 = 불필요하다"가 아니라 "짧지만 변경 격리 경계"로 기능한다.
