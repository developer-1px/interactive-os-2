# buttonToggle

> Enter/Space로 aria-pressed 토글. 자연 탭 순서.

## APG Examples

### #5 Button (Toggle)

```tsx render
<ButtonToggle />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | none (container) |
| childRole | button |
| focusStrategy | natural tab order |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- checked()

## 키맵 요약

| 키 | 동작 |
|---|------|
| Enter | aria-pressed 토글 |
| Space | aria-pressed 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-pressed | state.checked |
