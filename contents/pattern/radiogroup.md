# radiogroup

> 하나만 선택 가능한 라디오 버튼 그룹

## Demo

```tsx render
<ShowcaseDemo slug="radio-group" />
```

### Radio Group (activedescendant)

```tsx render
<PatternDemo example="radiogroupActivedescendant" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | radiogroup |
| childRole | radio |
| focusStrategy | roving tabindex |
| selectionMode | single |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- select(single)
- activate(onClick)
- navigate(both, wrap)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 다음 라디오로 이동 + 선택 |
| ArrowUp | 이전 라디오로 이동 + 선택 |
| ArrowRight | 다음 라디오로 이동 + 선택 |
| ArrowLeft | 이전 라디오로 이동 + 선택 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-checked | state.selected |

## 관련

- UI: RadioGroup
- 그룹: Navigation
