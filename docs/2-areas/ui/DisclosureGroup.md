# DisclosureGroup

> 펼침/접힘 그룹 — 각 항목이 독립적으로 토글

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## behavior 대응

- pattern: disclosure
- role: region
- childRole: (div)

## DOM 구조

```
div[role=region] container
  └─ div item
       ├─ chevron (▾/▸)
       └─ [aria-expanded] content
```

## CSS

- 방식: Global CSS
- 파일: 전역 스타일
