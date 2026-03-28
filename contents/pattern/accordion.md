# accordion

> 섹션을 접고 펼 수 있는 아코디언

## Demo

```tsx render
<ShowcaseDemo slug="accordion" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | region |
| childRole | heading |
| focusStrategy | roving tabindex |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- activate(onClick, toggleExpand)
- navigate(vertical)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 다음 헤딩으로 이동 |
| ArrowUp | 이전 헤딩으로 이동 |
| Home | 첫 번째 헤딩으로 이동 |
| End | 마지막 헤딩으로 이동 |
| Enter | 현재 섹션 토글 |
| Space | 현재 섹션 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-expanded | state.expanded |

## 관련

- UI: Accordion
- 그룹: Navigation
