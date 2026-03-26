# tab()

> Tab 키 전략 축. Tab이 zone 안에서 어떻게 동작할지 결정한다.

## 스펙

| 전략 | Tab 동작 | focusStrategy |
|------|---------|---------------|
| native | engine 미개입, 브라우저 기본 | — |
| flow | 모든 노드 tabIndex=0, DOM 순서 | natural-tab-order |
| loop | flow + 마지막→처음 순환 | natural-tab-order |
| escape | roving-tabindex, Tab으로 zone 탈출 | roving-tabindex |

### 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| orientation | `'vertical' \| 'horizontal' \| 'both'` | `'both'` | escape 전략의 roving-tabindex 방향 |

## 관계

- **navigate**의 `grid.tabCycle`과 충돌 — Tab keyMap이 겹침. 동시 사용 금지.
- **escape**는 roving-tabindex 기반이므로 navigate와 자연스럽게 조합

## 데모

```tsx render
<TabDemo />
```

## 관련

- [behavior-axis-decomposition-prd](/docs/superpowers/specs/2026-03-20-behavior-axis-decomposition-prd.md)
- 사용 패턴: tabs, toolbar, radiogroup
