# alertdialog

> 확인이 필요한 긴급 모달 대화 상자

## APG Examples

### #3 Alert Dialog

```tsx render
<AlertDialog />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | alertdialog |
| childRole | group |
| focusStrategy | focus trap |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- dismiss()

## 키맵 요약

| 키 | 동작 |
|---|------|
| Tab | 트랩 내 다음 포커스 가능 요소로 이동 |
| Shift+Tab | 트랩 내 이전 포커스 가능 요소로 이동 |
| Escape | 대화 상자 닫기 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-modal | "true" |
| aria-expanded | state.expanded |

## 관련

- UI: ⬜ (데모 페이지에서 인라인 구현)
- 그룹: Navigation
