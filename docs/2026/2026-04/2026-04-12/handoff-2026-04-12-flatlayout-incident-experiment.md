---
id: 4-archive/handoffs/handoff-2026-04-12-flatlayout-incident-experiment
title: 'FlatLayout incident 재현 실험 — widget 합성 한계 발견'
status: archived
kind: handoff
created: 2026-04-12
updated: 2026-04-15
summary: '2026-04-12 세션에서 FlatLayout이 어디까지 incident 수준 화면을 표현할 수 있는지 실험하고 10개 GAP을 발견·일부 해결.'
topics: [4-archive]
relates: []
supersedes: []
legacy:
  name: 'FlatLayout incident 재현 실험 — widget 합성 한계 발견'
  date: 2026-04-12
  consumed_by: 2026-04-15-archived
  consumed_at: 2026-04-15
---
# Handoff: FlatLayout incident 재현 실험

> 2026-04-12 세션에서 FlatLayout이 어디까지 incident 수준 화면을 표현할 수 있는지 실험하고 10개 GAP을 발견·일부 해결.

## 완료

| 커밋 | 내용 |
|------|------|
| `e1177b6f` | FlatLayout incident 재현 + useFlatLayout hook + StateNode + 도메인 Item |

### 변경/추가 파일

- `src/interactive-os/ui/useFlatLayout.ts` — FlatLayoutContext + hook (위젯이 dispatch/store 접근)
- `src/interactive-os/ui/FlatLayout.tsx` — Provider 감쌈, stack→fill
- `src/interactive-os/layout/flatLayout.ts` — `StateNode` 타입 추가 (데이터 전용 노드)
- `src/interactive-os/ui/items/TimelineItem.tsx` — 신규 (icon + title + detail + time)
- `src/interactive-os/ui/items/ServiceItem.tsx` — 신규 (StatusIndicator + name + latency)
- `src/pages/incident/PageIncidentFlat.tsx` — 신규 (FlatLayout 기반 페이지)
- `src/pages/incident/incidentCommands.ts`, `incidentPlugin.ts`, `incidentData.ts` — 신규
- `src/experiments/incidentWidgets.tsx` — 신규 (4개 widget, pages/ 훅 우회)
- `src/router.tsx` — `/incident`를 Flat 버전으로 교체, `/incident-legacy` 추가
- `docs/0-inbox/experiment-flatlayout-incident-gaps.md` — gap 정리 문서

### 실험 결과

- 브라우저(`/incident`)에서 동작 확인 — Monitor / Timeline / Capture / AI Analysis 4개 위젯이 command + shared store로 통신
- 자동 timeline reveal, 자동 event 선택, before/after 캡처 모두 정상
- 10개 GAP 발견, 4개 해결 (자세한 내용 → `docs/0-inbox/experiment-flatlayout-incident-gaps.md`)

## 남은 것

### 즉시 (다음 세션 첫 작업)

1. **GAP #6 근본 해결**: widget 레이어 위치 정립
   - 현재: `src/experiments/incidentWidgets.tsx`로 우회 (pages/ 훅 회피용)
   - 결정 필요: `src/widgets/`? `ui/composites/`? 새 레이어?
   - 영향: 도메인 의존성을 가진 ui 합성 컴포넌트의 정식 위치
   - 관련 memory: `project_a2ui_composites`, `feedback_composite_is_ui_combination`

2. **GAP #8 근본 해결**: FlatLayout `stack` 노드의 widget child sizing
   - 현재: `widget` renderer가 `splitChild` 클래스(`height: 100%`)를 무조건 적용해서 stack 안 multi-child가 겹침
   - 우회: `vertical split [0.05, 'flex']` 사용
   - 근본 해결: widget renderer가 부모 컨텍스트(split/stack/grid)를 알고 적절한 sizing 적용
   - 파일: `src/interactive-os/ui/FlatLayout.tsx` (line 273~ widget renderer)

3. **GAP #9 완전 해결**: ListBox 외부 selection sync API
   - 현재: TimelineItem에서 `aria-selected`를 외부 store로 override (반쪽짜리)
   - 문제: ListBox 내부 focused state는 첫 항목 그대로 → 두 개가 동시에 강조됨
   - 근본 해결: ListBox에 `selectedId` prop 추가하거나, focus axis와 외부 state sync
   - 파일: `src/interactive-os/ui/ListBox.tsx`, `src/interactive-os/primitives/aria.tsx`

### 이후

- **GAP #4**: StreamFeed renderItem용 message renderer registry (OCP)
  - 채팅 user/agent/system/tool 분기를 items/ 패턴과 다른 시그니처로 처리
- **GAP #2**: WidgetRegistry 타입 안전성 (`Record<string, ComponentType<Record<string, unknown>>>` → 제네릭)
- **GAP #3**: 정적 definePage vs 동적 props 분리 메커니즘
- **이전 세션 미커밋 잔여물 정리**: `clipboard-serialize.test.ts`, `axis/types.ts`, `useAriaZone.ts`, `MarkdownViewer.css/.demo.tsx`, `Composer.tsx`, `Meter.tsx`, `PanelHeader.demo.tsx`, `indicators/index.ts`, `PageComponentCreator.tsx`, `MermaidBlock.tsx`, `ax.css`, `ax.ts`, `SkillKanban.css/.tsx`, `SplitPane.tsx`, `CodeBlock.tsx` 등 — 무엇인지 확인 후 별도 커밋 또는 reset

## 컨텍스트

- **GAP 문서**: `docs/0-inbox/experiment-flatlayout-incident-gaps.md` — 10개 GAP 전체 분석
- **레거시 비교**: `/incident-legacy` 라우트 (원본 PageIncidentInterface 보존)
- **실험 라우트**: `/incident` (FlatLayout 기반)
- **관련 PRD**: `docs/2-areas/layout/prds/flatlayout-resizable-split-prd.md` (untracked)

### 주의

- main 브랜치에 직접 작업했음 (worktree 격리 안 함)
- 이전 세션의 미커밋 변경물 다수가 main에 그대로 남아있음 — 이번 커밋과 무관
- experiments/ 디렉토리는 이번에 새로 만든 임시 디렉토리. 정식 widget 위치 결정되면 이동해야 함

## 다음 행동 제안

`/go`로 시작하면 이 handoff를 자동으로 픽업한다.

구체적으로: **GAP #6 widget 레이어 위치 결정** — `/discuss`로 시작하여 `src/widgets/` vs `ui/composites/` vs 다른 옵션 중 결정한 뒤, `experiments/incidentWidgets.tsx`를 정식 위치로 이동하고, pages/ 훅 규칙도 그에 맞게 조정.
