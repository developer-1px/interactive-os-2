# Store (L1)

> 데이터 구조. Entity 기반 정규화 store.

## 주기율표

| 모듈 | 함수/타입 | 역할 | 상태 |
|------|----------|------|------|
| types | `Entity`, `NormalizedData`, `ROOT_ID`, `TransformAdapter` | 핵심 타입 정의 | 🟢 |
| createStore | `createStore()` | 정규화 데이터 store 생성, CRUD 연산 | 🟢 |
| storeToTree | `storeToTree()` | flat → tree 변환 | 🟢 |
| computeStoreDiff | `computeStoreDiff()` | 변경 감지 | 🟢 |

## 핵심 개념

- **Entity**: `{ id, data }` — 모든 데이터의 단위
- **NormalizedData**: `{ entities, relationships }` — 트리 구조의 정규화 저장

## 갭

- 직렬화 미구현
