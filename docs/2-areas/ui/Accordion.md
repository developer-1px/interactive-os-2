# Accordion

> 접이식 섹션 리스트 — 하나의 섹션만 펼쳐지는 아코디언 패턴

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 아코디언 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## behavior 대응

- pattern: accordion
- role: region
- childRole: (내부 FocusScrollDiv)

## DOM 구조

```
div[role=region] container
  └─ FocusScrollDiv
       └─ span.accordion-inner
            ├─ chevron (+/−)
            └─ label
```

## CSS

- 방식: Global CSS
- 파일: 전역 스타일
