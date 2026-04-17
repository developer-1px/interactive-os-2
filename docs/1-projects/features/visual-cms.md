---
name: Visual CMS
slug: visual-cms
layer: service
status: operational
maturity: 4
parent: null
deps: [flatlayout-engine]
routes: [/]
prds:
  - docs/1-projects/cms/prds/2026-03-24-cms-editorial-content-prd.md
  - docs/1-projects/cms/prds/2026-03-27-cms-image-field-prd.md
  - docs/1-projects/cms/prds/meta-editable-ssot-prd.md
handoffs: []
tags: [cms, flatlayout, landing, i18n]
created: 2025-11
last_touched: 2026-04-15
---

# Visual CMS

랜딩 페이지 자체를 편집 대상으로 삼는 Visual CMS. Figma Slides 레이아웃 영감, 하나의 앱 = 하나의 store 원칙 준수.

## Insights
- 2026-03-24 · 결정: editorial 9섹션(hero→footer) 스키마 확정, 4 신규 노드타입 추가
- 2026-03-27 · 피드백: image 필드 Form-only로 분리 — inline 편집 대상 아님
- 2026-04-15 · 관찰: preview 공간이 Detail 열림 시 좁다 — SplitPane resizer 후속 과제

## Decisions
- 2026-04-01 · FlatLayout 전환 완료 — resizer 미구현은 1차 범위 밖으로 유지

## Gaps
- [ ] Detail 패널 resizer
- [ ] Viewer 채널(CMS → viewer 브릿지) 실전 검증
