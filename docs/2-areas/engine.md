# Engine (L2)

> Command 기반 상태 변환 엔진.

## 주기율표

| 모듈 | 함수/타입 | 역할 | 상태 |
|------|----------|------|------|
| types | `Command`, `BatchCommand`, `createBatchCommand`, `Middleware` | 실행 타입 정의 | 🟢 |
| createCommandEngine | `createCommandEngine()` | Command 파이프라인 실행, 플러그인 체인 | 🟢 |
| dispatchLogger | `dispatchLogger`, `Logger` | 디스패치 로깅 | 🟢 |
| useEngine | `useEngine()` | React 바인딩 | 🟢 |

## 핵심 개념

- **Command**: `(store) => store` — 순수 함수로 상태 변환
- **Middleware**: Command 실행 전후에 개입하는 체인
- **BatchCommand**: 다중 커맨드 원자 실행

## 의존 방향

```
store/types (Entity, NormalizedData)
  ↓
engine/types (Command, Middleware)
  ↓
createCommandEngine (Command 실행)
  ↓
plugins, pattern (소비자)
```

## 갭

(없음 — engine은 안정)
