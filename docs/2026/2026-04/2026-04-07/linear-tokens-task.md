---
id: 1-projects/cms/prds/linear-tokens-task
type: plan
slug: linearTokens
title: 'Linear 실측 → tokens.css 적용'
tags: [untagged]
created: 2026-04-07
updated: 2026-04-08
summary: 'DESIGN.md L-5 적용 우선순위 기반'
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Linear 실측 → tokens.css 적용

> DESIGN.md L-5 적용 우선순위 기반

## 액션 플랜

1. **font weight 450** — `--weight-book: 430→450`, `--type-body-weight: 430→450`, `--type-caption-weight: 430→450`
2. **border 0.5px** — `--border-width: 1px→0.5px` (input, overlay에 영향)
3. **아이템 높이 28px** — `--sidebar-item-height: 32px→28px`, 신규 `--item-height: 28px`
4. **shadow 정리** — overlay만 shadow, raised에서 shadow 제거 검토
5. **font size 13px** — `--type-body-size: 14px→13px` 검토
6. **설정 행 패턴** — 신규 토큰 추가 (필요 시)

## 영향 파일

- `src/styles/tokens.css` — 토큰 값 변경
- `src/styles/axes.css` — 축 CSS에서 토큰 소비하는 부분 확인
- `src/interactive-os/ui/*` — 완성품 컴포넌트 기본값 확인

#kind/plan #topic/cms
