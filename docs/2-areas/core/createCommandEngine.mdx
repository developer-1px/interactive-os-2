# createCommandEngine()

> Command 디스패처. 미들웨어 체인 + 상태 변경 알림.

## API

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| dispatch | `(command) → void` | 미들웨어 체인 → execute → onChange |
| getStore | `() → NormalizedData` | 현재 store 스냅샷 |
| syncStore | `(newStore) → void` | 외부 데이터 바인딩 (onChange 미발생) |

## 생성

```typescript
createCommandEngine(initialStore, middlewares, onStoreChange)
```

## 미들웨어 체인

```
dispatch(command)
  → middleware[0](next)(command, store)
    → middleware[1](next)(command, store)
      → ... → executor(command, store)
        → command.execute(store) → newStore
          → onStoreChange(newStore)
```

## 설계 원칙

- 단일 진실 원천 (Single Source of Truth)
- right-reduce 합성으로 미들웨어 체인 구성
- execute 실패 시 store 자동 복원
- syncStore는 controlled/external-sync 시나리오 전용
