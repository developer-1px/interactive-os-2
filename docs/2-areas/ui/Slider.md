# Slider

> 연속값 슬라이더 — 트랙 클릭 + 드래그 지원

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 슬라이더 데이터 |
| min | number | — | 최솟값 |
| max | number | — | 최댓값 |
| step | number | — | 증감 단위 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |

## behavior 대응

- pattern: `slider({min, max, step})`
- role: slider
- childRole: —

## DOM 구조

```
div.slider-item container
  └─ div.slider-track (click)
       ├─ div.slider-fill
       ├─ div.slider-thumb
       └─ span.slider-value
```

## CSS

- 방식: Global CSS
- 파일: 전역 스타일
