# types

> Store 레이어 핵심 타입. 데이터 모델과 변환 인터페이스.

## 주요 타입

| 타입 | 설명 |
|------|------|
| `Entity<T>` | `{ id, data?, [key]: unknown }` — 모든 데이터의 단위. 제네릭 T로 data 타입 지정 |
| `NormalizedData` | `{ entities, relationships }` — 트리 구조의 정규화 저장 |
| `PaneSize` | `number \| 'flex'` — 분할 레이아웃 패널 크기 (비율 또는 flex) |
| `TransformAdapter<T>` | 외부 ↔ NormalizedData 양방향 변환 어댑터 |

## 핵심 상수

| 상수 | 값 | 설명 |
|------|---|------|
| `ROOT_ID` | `'__root__'` | 최상위 부모 ID |

## 설계 원칙

- Entity는 open interface (`[key: string]: unknown`) — 메타 엔티티가 임의 필드 저장
- NormalizedData = 2-table 정규화: entities(플랫 맵) + relationships(부모→자식 배열)
- TransformAdapter로 외부 데이터 형식과 디커플링
