# menu

> 동작 목록을 제공하는 수직 메뉴

## Demo

```tsx render
<ShowcaseDemo slug="menu-list" />
```

### Menu (activedescendant)

```tsx render
<PatternDemo example="menuActivedescendant" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | menu |
| childRole | menuitem |
| focusStrategy | roving tabindex |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- activate(onClick)
- expand(arrow)
- navigate(vertical)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 다음 메뉴 항목으로 이동 |
| ArrowUp | 이전 메뉴 항목으로 이동 |
| ArrowRight | 하위 메뉴 열기 |
| ArrowLeft | 하위 메뉴 닫기 |
| Enter | 현재 항목 활성화 |
| Space | 현재 항목 활성화 |
| Home | 첫 번째 항목으로 이동 |
| End | 마지막 항목으로 이동 |
| Escape | 메뉴 닫기 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-expanded | state.expanded (하위 메뉴 보유 시) |

## 관련

- UI: MenuList
- 그룹: Navigation
