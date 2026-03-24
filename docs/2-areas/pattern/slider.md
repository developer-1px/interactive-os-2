# Slider

> 연속 값 조작. `slider({ min, max, step })` → horizontal value 축.

## 스펙

| 속성 | 값 |
|------|-----|
| role (container) | none |
| childRole (item) | slider |
| focusStrategy | natural-tab-order |
| valueRange | `{ min, max, step }` |
| ARIA | aria-valuenow, aria-valuemin, aria-valuemax, aria-label |

## Walkthrough

| # | 체험 항목 | 조작 | 기대 결과 |
|---|----------|------|----------|
| 1 | 값 1씩 증가 | →↑ | aria-valuenow +1 |
| 2 | 값 1씩 감소 | ←↓ | aria-valuenow -1 |
| 3 | 큰 폭 증가 | PageUp | aria-valuenow +step×10 |
| 4 | 큰 폭 감소 | PageDown | aria-valuenow -step×10 |
| 5 | 최소값 이동 | Home | aria-valuenow = min |
| 6 | 최대값 이동 | End | aria-valuenow = max |
| 7 | 경계 클램프 | End → → | 값 변화 없음 |
| 8 | 트랙 클릭 | 마우스 클릭 | 클릭 위치 비례 값 설정 |
| 9 | undo | Ctrl+Z | 이전 값 복원 |
| 10 | 포커스 링 | Tab in | 썸에 포커스 링 표시 |

## UI 구조

```
[role=none] container
  └─ [role=slider] thumb (tabIndex=0)
       ├─ .slider-track (클릭 가능)
       │   ├─ .slider-fill (width=%)
       │   └─ .slider-thumb (left=%)
       └─ .slider-value (현재 값 텍스트)
```
