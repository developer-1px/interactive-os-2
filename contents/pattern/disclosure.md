# disclosure

> 콘텐츠를 보이거나 숨기는 디스클로저 그룹

## Demo

```tsx render
<ShowcaseDemo slug="disclosure-group" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | group |
| childRole | button |
| focusStrategy | roving tabindex |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- activate(onClick, toggleExpand)

## 키맵 요약

| 키 | 동작 |
|---|------|
| Enter | 현재 디스클로저 토글 |
| Space | 현재 디스클로저 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-expanded | state.expanded |

## 관련

- UI: DisclosureGroup
- 그룹: Navigation
