---
id: 4-archive/handoffs/handoff-2026-04-13-widget-boundary
type: handoff
slug: widgetBoundary
title: 'Handoff: 위젯/컴포넌트 경계 구조적 강제'
tags: [untagged]
created: 2026-04-13
updated: 2026-04-15
summary: '2026-04-13 세션에서 ui→pages 역방향 의존 제거 + 위젯 경계 차단 규칙 추가'
legacy:
  consumed_by: 2026-04-15-archived
  consumed_at: 2026-04-15
  status: archived
  kind: handoff
  topics: [4-archive]
  relates: []
  supersedes: []
---
# Handoff: 위젯/컴포넌트 경계 구조적 강제

> 2026-04-13 세션에서 ui→pages 역방향 의존 제거 + 위젯 경계 차단 규칙 추가

## 완료

| 커밋 | 내용 |
|------|------|
| `69004846` | ui→pages 역방향 import 제거 (MarkdownViewer config 주입, FileViewer 타입 이동), dependency-cruiser `no-ui-to-pages` error 규칙, guardOsPatterns 규칙 25-27 (위젯 placement/querySelector/rAF 차단), showcaseMdConfig 공유 모듈 추출, remarkPlugins useMemo |

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **2종 위반 리팩토링** — 위젯 파일에서 `ax({ placement })` 사용 제거
   - `src/pages/book/bookWidgets.tsx` — BookPill `placement: 'top-start'`, BookTocOverlay/BookQuickOpen
   - `src/pages/i18n/i18nWidgets.tsx` — `placement: 'below'`
   - `src/pages/incident/incidentWidgets.tsx` — `layout: 'grid-2'`
   - 대안: FlatLayout overlay/floating 노드로 이동

2. **3종 위반 리팩토링** — 위젯 파일에서 DOM 직접 조작 제거
   - `src/pages/cms/CmsSidebar.tsx` — `document.querySelector` + `scrollIntoView`
   - `src/pages/cms/CmsDetailPanel.tsx` — `requestAnimationFrame` + `.focus()`
   - 대안: engine navigate 축, useRef, useEffect

### 이후
- `no-ui-to-pages` 규칙이 잡는 **demo 파일 내 pages/ import** — demo 파일들이 pages/showcase/의 fixture를 import하는 패턴이 많음. 이걸 정리할지 별도 검토
- `FileViewer.tsx`의 `ReplayCursor` 인라인 컴포넌트가 `style={{}}` 사용 — module.css + CSS variable로 전환 필요

## 컨텍스트

- **discuss 결론**: 위젯=배치의 단위(FlatLayout 슬롯), 컴포넌트=인터랙션의 단위(ui/). 위젯은 ui/ 조합 + 도메인 중간 계층
- **3종 위반 분류**: 1종(역방향 import) 해결, 2종(배치 침범) 탐지 장치 추가, 3종(DOM 직접 조작) 탐지 장치 추가
- **관련 memory**: `feedback_flatlayout_pull_not_push`, `feedback_arrangement_xyz`, `project_flat_layout_engine`

## 다음 행동 제안

`/go`로 시작하면 이 handoff를 자동으로 픽업한다.
구체적으로: 2종 위반 파일(bookWidgets, i18nWidgets, incidentWidgets)부터 FlatLayout 노드로 전환
