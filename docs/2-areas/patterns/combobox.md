# combobox

> 텍스트 입력 + 팝업 옵션 목록 결합 콤보박스

## 스펙

| 속성 | 값 |
|------|-----|
| role | combobox |
| childRole | option |
| focusStrategy | aria-activedescendant |
| selectionMode | single, multiple |

## 축 조합

표준 축 조합이 아닌 커스텀 구현:
- custom popupToggle
- custom navV (수직 탐색)

> Note: 키맵이 하드코딩됨, trigger↔popup 축 분리 미결정(⬜).

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 팝업 열기 / 다음 옵션으로 이동 |
| ArrowUp | 이전 옵션으로 이동 |
| Enter | 현재 옵션 선택 |
| Escape | 팝업 닫기 |
| Home | 입력 시작으로 커서 이동 |
| End | 입력 끝으로 커서 이동 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-selected | state.selected (on option) |
| aria-expanded | popup open state (on combobox) |
| aria-activedescendant | focused option id |
| aria-autocomplete | list / both |

## 관련

- UI: Combobox
- 그룹: Navigation
