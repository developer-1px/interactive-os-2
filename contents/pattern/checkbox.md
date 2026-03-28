# checkbox

> Space/Enter로 체크 토글. 자연 탭 순서.

## APG Examples

### #9 Checkbox (Two State)

```tsx render
<CheckboxGroup />
```

### #10 Checkbox (Mixed-State)

부모가 자식의 집계 상태 반영 (true/false/mixed).

```tsx render
<CheckboxMixed />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | group |
| childRole | checkbox |
| focusStrategy | natural tab order |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- checked()

### Mixed-State 추가 축
- checked()
- alwaysDescend (VisibilityFilter)
- navigate(wrap: false)

## 키맵 요약

| 키 | 동작 |
|---|------|
| Enter | aria-checked 토글 |
| Space | aria-checked 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-checked | state.checked (true/false/mixed) |
