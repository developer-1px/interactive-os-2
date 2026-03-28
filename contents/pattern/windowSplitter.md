# windowSplitter

> 두 패널 사이의 이동 가능한 구분선. value 축 사용.

## APG Examples

### #67 Window Splitter

```tsx render
<WindowSplitter />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | none (container) |
| childRole | separator |
| focusStrategy | natural tab order |

## 축 조합

`windowSplitter({ min, max, step, orientation })` 호출:
- value(min, max, step, orientation)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowRight / ArrowUp | 값 증가 |
| ArrowLeft / ArrowDown | 값 감소 |
| Home | 최솟값으로 |
| End | 최댓값으로 |
| PageUp | 큰 단위 증가 |
| PageDown | 큰 단위 감소 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-valuenow | state.valueCurrent |
| aria-valuemin | min |
| aria-valuemax | max |
| aria-orientation | orientation |
