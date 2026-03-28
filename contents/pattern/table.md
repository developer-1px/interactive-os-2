# table

> 정적 테이블. rowgroup > row > cell 3단 계층. 비인터랙티브.

## Demo

```tsx render
<PatternDemo example="table" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | table |
| childRole | rowgroup / row / cell (level별) |
| focusStrategy | natural tab order |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- expand() — 중첩 레벨 가시성 게이팅

## ARIA 속성

없음 (정적 구조).
