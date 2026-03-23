# types

> 핵심 타입 정의. Entity, NormalizedData, Command, Plugin.

## 주요 타입

| 타입 | 설명 |
|------|------|
| `Entity<T>` | `{ id, data }` — 모든 데이터의 단위 |
| `NormalizedData` | `{ entities, relationships }` — 트리 구조의 정규화 저장 |
| `Command` | `{ name, execute(store), undo() }` — 순수 함수로 상태 변환 |
| `BatchCommand` | 여러 Command를 원자적으로 실행 |
| `Plugin` | `{ name, middlewares?, commands?, keyMap? }` — 미들웨어 + 커맨드 확장 |
| `Middleware` | `(next) => (command, store) => store` — 커맨드 인터셉터 체인 |
| `TransformAdapter<T>` | 외부 ↔ 내부 데이터 양방향 변환 |

## 핵심 상수

| 상수 | 값 | 설명 |
|------|---|------|
| `ROOT_ID` | `'__root__'` | 최상위 부모 ID |

## 설계 원칙

- Command는 first-class 불변 객체 (메서드가 아님)
- 각 Command가 자체 undo 스냅샷을 캡처
- Middleware로 플러그인이 커맨드 실행 전후에 개입
