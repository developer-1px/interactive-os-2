# createStore()

> 정규화 데이터 store. Entity 기반 트리 CRUD.

## API

| 함수 | 시그니처 | 설명 |
|------|---------|------|
| createStore | `(initial?) → NormalizedData` | ROOT 포함 빈 store 생성 |
| getEntity | `(store, id) → Entity` | O(1) 엔티티 조회 |
| getChildren | `(store, parentId) → string[]` | 직계 자식 ID 배열 |
| getParent | `(store, nodeId) → string` | 부모 ID (O(n) 선형 탐색) |
| addEntity | `(store, entity, parentId, index?) → store` | 삽입 (위치 지정 가능) |
| removeEntity | `(store, nodeId) → store` | 재귀 cascade 삭제 |
| updateEntity | `(store, nodeId, updates) → store` | shallow merge |
| moveNode | `(store, nodeId, newParentId, index?) → store` | 부모 변경 + 재정렬 |
| getEntityData | `(store, id) → T` | 타입 안전 data 추출 |
| updateEntityData | `(store, nodeId, updates) → store` | data shallow merge |

## 데이터 구조

```
NormalizedData {
  entities: { [id]: { id, data?, ...custom } }
  relationships: { [parentId]: [childId, ...] }  // __root__ = 기본 부모
}
```

## 설계 원칙

- 모든 연산이 새 NormalizedData 반환 (불변)
- 관계(relationships)를 엔티티와 분리 저장
- 트리 모델 + 정규화 노드 저장
