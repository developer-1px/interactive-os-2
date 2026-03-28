# meter

> 표시 전용 값 인디케이터. 키보드 인터랙션 없음.

## Demo

```tsx render
<PatternDemo example="meter" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | none (container) |
| childRole | meter |
| focusStrategy | — |

## 축 조합

`composePattern(identity)` — 축 없음. 비인터랙티브.

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-valuenow | node.data.value |
| aria-valuemin | node.data.min |
| aria-valuemax | node.data.max |
