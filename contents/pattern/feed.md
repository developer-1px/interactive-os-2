# feed

> Page Down/Page Up으로 아티클 간 이동. 화살표 키는 스크롤용.

## APG Examples

### #24 Infinite Scrolling Feed

```tsx render
<Feed />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | feed |
| childRole | article |
| focusStrategy | roving tabindex (vertical) |

## 축 조합

`composePattern(identity, feedAxis)` — 커스텀 keyMap 사용.

## 키맵 요약

| 키 | 동작 |
|---|------|
| PageDown | 다음 아티클로 이동 |
| PageUp | 이전 아티클로 이동 |
