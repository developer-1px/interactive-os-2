---
id: flatlayout-engine
type: note
slug: flatlayoutEngine
title: FlatLayout Engine
tags: [definepage, flatlayout, pull-model, widget]
created: 2025-10
updated: 2026-04-17
summary: '유일 레이아웃 엔진. JSX 트리 대신 flat 선언(`definePage`)으로 XY+Z 배치 소유권을 엔진에 위임. widget은 React 책임, layout은 엔진 책임으로 경계 분리.'
legacy:
  name: FlatLayout Engine
  slug: flatlayout-engine
  layer: engine
  maturity: 5
  deps: []
  routes: []
  prds: []
  handoffs: []
  tags: [flatlayout, definePage, widget, pull-model]
  last_touched: 2026-04-16
  status: operational
  kind: note
  topics: [1-projects, definepage, flatlayout, pull-model, widget]
  parent: null
  relates: []
  supersedes: []
---
# FlatLayout Engine

유일 레이아웃 엔진. JSX 트리 대신 flat 선언(`definePage`)으로 XY+Z 배치 소유권을 엔진에 위임. widget은 React 책임, layout은 엔진 책임으로 경계 분리.

## Insights
- 2025-11-20 · 결정: pull 모델 — widget이 slot 존재를 확인하지 않고 엔진이 주입
- 2026-02-08 · 관찰: 인접 노드 구분 수단(surface/divider/gap/padding)은 declaration 필수 — 암묵 구분 금지
- 2026-04-01 · 수렴: FlatLayout 10 GAP 중 4 해결 (incident experiment)

## Decisions
- 2026-01-15 · LAYOUT.md를 SSOT로 승격 — definePage 사용자는 스펙을 읽고 따른다

## Gaps
- [ ] resizer(SplitPane) 공식 지원
- [ ] nested 9-variant 시 keyboard 네비 일관성 회귀 테스트
