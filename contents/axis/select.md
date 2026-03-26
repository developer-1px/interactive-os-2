# select()

> 선택 축. Space로 토글, Shift+방향키로 범위 선택.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| Space | toggleSelect | 항상 |
| Shift+ArrowDown | extendSelection('next') | extended=true |
| Shift+ArrowUp | extendSelection('prev') | extended=true |
| Shift+Home | extendSelection('first') | extended=true |
| Shift+End | extendSelection('last') | extended=true |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| mode | `'single' \| 'multiple'` | `'multiple'` | 선택 모드 |
| extended | `boolean` | `false` | Shift 범위 선택 (multiple일 때만) |

## 관계

- **activate**와 Space 키 공유 → chain of responsibility로 해결 (compose 순서에서 select가 우선)
- **navigate**와 조합 → listbox multi-select (Shift+↑↓로 범위 선택)
- 단독 사용 안 함 — 항상 navigate + activate와 함께

## 데모

```tsx render
<SelectDemo />
```

## 관련

- 사용 패턴: listbox, tree, treegrid, grid, radiogroup, tabs, spatial
