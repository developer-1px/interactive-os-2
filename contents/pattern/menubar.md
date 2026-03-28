# menubar

> 수평 내비게이션 메뉴바 + 수직 서브메뉴 (중첩 지원)

## APG Examples

### #40 Navigation Menubar

```tsx render
<MenubarNavigation />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | menubar |
| childRole | menuitem |
| focusStrategy | roving tabindex (horizontal) |

## 축 조합

`composePattern(identity, expandConfig(), inputMap)` 호출:
- expandConfig — submenu visibility gating
- custom inputMap — bar↔submenu level 전환 핸들러

## 키맵 요약

### Menubar 레벨

| 키 | 동작 |
|---|------|
| ArrowRight | 다음 menubar 항목 (wrap) |
| ArrowLeft | 이전 menubar 항목 (wrap) |
| ArrowDown | submenu 열고 첫 항목 포커스 |
| ArrowUp | submenu 열고 마지막 항목 포커스 |
| Enter / Space | submenu 열기 또는 활성화 |
| Home | 첫 menubar 항목 |
| End | 마지막 menubar 항목 |

### Submenu 레벨

| 키 | 동작 |
|---|------|
| ArrowDown | 다음 submenu 항목 (wrap) |
| ArrowUp | 이전 submenu 항목 (wrap) |
| ArrowRight | 중첩 submenu 열기 / 다음 menubar 항목 submenu |
| ArrowLeft | 중첩 submenu 닫기 / 이전 menubar 항목 submenu |
| Escape | submenu 닫고 부모 포커스 |
| Home | submenu 첫 항목 |
| End | submenu 마지막 항목 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-expanded | submenu 보유 항목의 열림/닫힘 상태 |
| aria-haspopup | auto ARIA (자식 있는 menuitem) |

## 설계 노트

Menubar는 multi-zone이 아니라 **level 전환**이다. treegrid의 row↔cell 모드와 동형:
- `popupTriggerId` 대신 `expandedIds`로 submenu visibility 게이팅
- 핸들러가 `isMenubarLevel()` / `getParent()`로 현재 레벨 판별
- exclusive open: 같은 레벨에서 하나의 submenu만 열림

## 관련

- Pattern: menu, menuButton
- Axis: expand, navigate
