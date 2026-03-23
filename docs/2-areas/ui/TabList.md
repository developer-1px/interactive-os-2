# TabList

> 탭 탐색 — 편집(Delete, F2, Alt+←/→ 리오더) 지원

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 탭 항목 데이터 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |
| enableEditing | boolean | — | Delete, F2, Alt+←/→ 리오더 활성화 |

## behavior 대응

- pattern: tabs
- role: tablist
- childRole: tab

## DOM 구조

```
div[role=tablist, display:flex] container
  └─ div[role=tab, aria-selected] item
```

## CSS

- 방식: CSS Modules
- 파일: TabList.module.css
