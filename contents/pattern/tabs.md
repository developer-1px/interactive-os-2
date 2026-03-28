# tabs

> 수평 탭으로 패널을 전환하는 탭 리스트

## APG Examples

### #59 Tabs with Automatic Activation

```tsx render
<TabsAutomatic />
```

### #60 Tabs with Manual Activation

```tsx render
<TabsManual />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | tablist |
| childRole | tab |
| focusStrategy | roving tabindex |
| selectionMode | single |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- select(single)
- activate(onClick, followFocus)
- navigate(horizontal)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowRight | 다음 탭으로 이동 |
| ArrowLeft | 이전 탭으로 이동 |
| Home | 첫 번째 탭으로 이동 |
| End | 마지막 탭으로 이동 |
| Enter | 현재 탭 활성화 |
| Space | 현재 탭 활성화 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-selected | state.selected |

## 관련

- UI: TabList
- 그룹: Navigation
