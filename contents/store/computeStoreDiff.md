# computeStoreDiff

> 두 NormalizedData 스냅샷의 차이를 계산하고, diff를 양방향으로 적용한다. History undo/redo의 기반.

## API

| 함수 | 시그니처 | 설명 |
|------|---------|------|
| computeStoreDiff | `(prev, next) → StoreDiff[]` | 두 스냅샷 간 차이 목록 생성 |
| applyDelta | `(store, diffs, direction) → store` | diff를 forward 또는 reverse로 적용 |

## StoreDiff 구조

```ts
interface StoreDiff {
  path: string                          // diff 위치
  kind: 'added' | 'removed' | 'changed'
  before?: unknown                      // 이전 값 (added면 없음)
  after?: unknown                       // 이후 값 (removed면 없음)
}
```

## Diff 분류

| path 형태 | 대상 | 예시 |
|-----------|------|------|
| `'entities'` | 콘텐츠 엔티티 추가/삭제/변경 | entity 전체 |
| `'__focus__.focusedId'` | 메타 엔티티 필드 | `__` prefix → 필드 단위 diff |
| `parentId` | relationship 배열 변경 | 자식 순서/추가/삭제 |

## 메타 vs 콘텐츠 엔티티

- **메타** (`__` prefix): 필드 단위 diff → undo 시 개별 필드만 복원
- **콘텐츠**: 엔티티 단위 diff → undo 시 엔티티 전체 복원

이 분리 덕에 focus/selection 같은 시스템 상태 변경이 콘텐츠 undo와 독립적으로 추적된다.

## 설계 원칙

- 참조 동등성 우선 — `prev === next`면 빈 배열 즉시 반환
- 대칭 적용 — `applyDelta(forward)` ↔ `applyDelta(reverse)`로 undo/redo 구현
- 불변 — 원본 store를 변경하지 않음
