# switch

> 켜기/끄기 토글 스위치 그룹

## APG Examples

### #54 Switch

```tsx render
<SwitchGroup />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | switch |
| childRole | switch |
| focusStrategy | roving tabindex |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- activate(onClick, toggleExpand)

## 키맵 요약

| 키 | 동작 |
|---|------|
| Enter | 스위치 토글 |
| Space | 스위치 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-checked | state.expanded |

## 관련

- UI: SwitchGroup
- 그룹: Navigation
