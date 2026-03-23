# navigate()

> 키보드 네비게이션 축. ↑↓←→ Home End로 포커스를 이동한다.

## 스펙

| 키 | 동작 | 조건 |
|---|---|---|
| ↑ | focusPrev | orientation: vertical 또는 both |
| ↓ | focusNext | orientation: vertical 또는 both |
| ← | focusPrev | orientation: horizontal 또는 both |
| → | focusNext | orientation: horizontal 또는 both |
| Home | focusFirst | — |
| End | focusLast | — |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| orientation | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | 화살표 키 방향 |
| wrap | `boolean` | `false` | 끝에서 처음으로 순환 |
| grid | `{ columns: number }` | — | 2D 그리드 모드 (navGrid 활성화) |

## 관계

- **select**와 조합 → listbox multi-select (Shift+↑↓로 범위 선택)
- **expand**와 조합 → tree navigation (←→로 expand/collapse, depthArrow가 navigate보다 우선)
- **value**와 키 충돌 → ←→ 겹침 (chain of responsibility로 해결, value가 우선)
- **activate**와 독립 → Enter/Space는 navigate가 관여하지 않음

## 데모

```tsx render
<NavigateDemo />
```

## 관련

- [behavior-axis-decomposition-prd](/docs/superpowers/specs/2026-03-20-behavior-axis-decomposition-prd.md)
- 사용 패턴: listbox, tree, treegrid, grid, menu, toolbar, tabs, radiogroup, combobox
