---
id: 1-projects/viewer/prds/inspector-improve-task
type: plan
slug: inspectorImprove
title: 'Inspector Improve — Task'
tags: [untagged]
created: 2026-04-05
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Inspector Improve — Task

## 배경
/improve에서 도출된 Feature 2개 + 부수 개선 2개

## 태스크

- [ ] F1: Pick Mode — 화면 요소 클릭 → inspector가 해당 인스턴스+노드 자동 선택
  - InspectorWindow에 "Pick" 토글 버튼
  - main window에 클릭 핸들러 → data-node-id / data-aria-container 역추적
  - postMessage or CustomEvent로 inspector에 전달
  - 기존 inspector:highlight-element 인프라 활용

- [ ] F2: ARIA Diff — OS 의도 vs DOM 실측 비교
  - AriaTabContent에서 선택 노드의 DOM element 찾기 (data-node-id)
  - DOM element의 실제 aria-* 읽기
  - 2열 비교 테이블 (OS Intent / DOM Actual), 불일치 시 하이라이트
  - OS 값 표시가 주(primary), DOM은 검증용 보조

- [ ] B1: State 탭 meta/data 그룹 분리
  - AppInspector의 inspectToTree에서 __ prefix 엔티티를 "Meta" 그룹으로 분리
  - data 엔티티만 기본 노출, meta는 접혀있음

- [ ] B2: State diff flash
  - InspectorWindow에서 이전 inspectResult 보관
  - 현재와 비교하여 변경된 entity/field에 배경색 flash 효과

## 의존 순서
F1 → F2 (Pick이 있어야 DOM element를 찾아서 비교 가능)
B1, B2는 독립 — F1/F2와 병렬 가능

#kind/plan #topic/viewer
