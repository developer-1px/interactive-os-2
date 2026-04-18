---
id: 1-projects/cms/prds/linear-component-gap-task
type: plan
slug: linearComponentGap
title: 'Linear 벤치마크 — 컴포넌트 갭 해소'
tags: [untagged]
created: 2026-04-07
updated: 2026-04-08
summary: '프로젝트 관리 + AI 가시화 도구를 위한 ui/ 컴포넌트 확충'
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Linear 벤치마크 — 컴포넌트 갭 해소

> 프로젝트 관리 + AI 가시화 도구를 위한 ui/ 컴포넌트 확충

## 페이지 패턴 (Linear 기준)

| # | 유형 | 레이아웃 |
|---|------|---------|
| P1 | 리스트 뷰 | Sidebar + Toolbar + List |
| P2 | 보드 뷰 | Sidebar + Kanban columns |
| P3 | 상세 뷰 | Sidebar + Main + PropertySidebar |
| P4 | 설정 뷰 | Sidebar + SettingsNav + Form |
| P5 | 채팅 뷰 | Sidebar + ChatFeed |
| P6 | 빈 상태 | Sidebar + EmptyState |

## 갭 컴포넌트 5개 (구현 순서)

1. **PropertyRow** — 키-값 행. 설정/상세뷰 속성. `label + value/control` spread layout.
2. **EmptyState** — 빈 상태. 아이콘 + 제목 + 설명 + CTA 버튼. 중앙 정렬.
3. **GroupHeader** — 그룹 구분 헤더. 아이콘 + 라벨 + 카운트 + 접기. Disclosure 연동.
4. **FilterBar** — 필터 칩 바. 칩(Badge 변형) + 추가 버튼. 가로 스크롤.
5. **IssueRow** — 복합 리스트 아이템. 상태아이콘 + 제목 + 라벨[] + 아바타 + 우선순위.

## 구현 규칙

- recipe 축 사용 (controlSize/padding 직접 사용 금지)
- ax()만 사용. style={} 금지
- 기존 ui/ 부품 재활용 (Badge, Button, Avatar 등)
- items/ 패턴 따르기 (renderItem 함수 시그니처)

#kind/plan #topic/cms
