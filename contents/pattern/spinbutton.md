# Spinbutton

> 숫자 값 입력. `spinbutton({ min, max, step })` → vertical value 축 + 직접 입력 + ▲▼ 버튼.

## APG Examples

### #53 Spinbutton

```tsx render
<Spinbutton />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role (container) | none |
| childRole (item) | spinbutton |
| focusStrategy | natural-tab-order |
| valueRange | `{ min, max, step }` |
| ARIA | aria-valuenow, aria-valuemin, aria-valuemax, aria-label, aria-invalid, aria-disabled |

## Walkthrough

| # | 체험 항목 | 조작 | 기대 결과 |
|---|----------|------|----------|
| 1 | 값 증가 | ↑ | aria-valuenow +step |
| 2 | 값 감소 | ↓ | aria-valuenow -step |
| 3 | 큰 폭 증가 | PageUp | +step×10 |
| 4 | 큰 폭 감소 | PageDown | -step×10 |
| 5 | 최소값 | Home | aria-valuenow = min |
| 6 | 최대값 | End | aria-valuenow = max |
| 7 | 좌우 무반응 | ←→ | 값 변화 없음 (vertical only) |
| 8 | + 버튼 클릭 | 마우스 클릭 | +step |
| 9 | − 버튼 클릭 | 마우스 클릭 | -step |
| 10 | 직접 입력 | 값 클릭 → 숫자 타이핑 → Enter | 입력값으로 설정 (클램프) |
| 11 | 편집 중 ↑↓ | 값 클릭 → ↑↓ | 편집 중에도 값 증감 + 표시 동기화 |
| 12 | 편집 취소 | 값 클릭 → Escape | 편집 취소, 원래 값 유지 |
| 13 | 잘못된 입력 | "abc" 입력 → Enter | aria-invalid, 에러 스타일 |
| 14 | 빈 입력 | 값 지우고 blur | min으로 리셋 |
| 15 | 경계 버튼 비활성 | min일 때 | − 버튼 aria-disabled |
| 16 | undo | Ctrl+Z | 이전 값 복원 |

## UI 구조

```
[role=none] container
  └─ [role=spinbutton] item (tabIndex=0)
       ├─ .spinbutton-label ("Count")
       └─ .spinbutton-group (통합 포커스 링)
            ├─ button.spinbutton-btn--dec "−" (tabIndex=-1)
            ├─ .spinbutton-value | input.spinbutton-input (클릭 시 전환)
            └─ button.spinbutton-btn--inc "+" (tabIndex=-1)
```

## APG 참조

[W3C APG — Quantity Spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/examples/quantity-spinbutton/)
