---
id: handoffFinderSubtreeFix
type: handoff
slug: handoffFinderSubtreeFix
title: "Handoff: Finder subtree 클릭 시 트리 접힘 버그 수정"
tags: [handoff, finder, splitpane, bug-fix]
created: 2026-04-19
updated: 2026-04-19
status: open
summary: "SplitPane이 child 1개일 때 Fragment로 단락해 sibling hidden 토글 시 subtree 리마운트 → Finder 트리 expand 상태가 소실되던 버그 수정 + gmail mockup WIP을 로컬 working tree에 보존"
---

# Handoff: Finder subtree 클릭 시 트리 접힘 버그 수정

> Finder에서 폴더를 펼친 뒤 파일을 클릭하는 순간 preview 패널이 hidden→visible로 바뀌며 트리가 통째로 접히던 증상을 SplitPane의 구조 불일치에서 찾아 수정.

## 완료

| 커밋 | 내용 |
|------|------|
| `228a34bc` | `fix(SplitPane)`: length≤1 Fragment shortcut 제거. Fragment→div wrapper 구조 변경이 React reconciliation을 깨뜨려 TreeGrid 전체 subtree를 리마운트하던 것을 차단. engine의 expand 상태가 preview 패널 출현에도 유지됨. |
| `d90981d5` | `chore(ci)`: pre-push ratchet이 누적 regression(warnings 243→247, 이전 inspector 커밋 2건)로 막혀 있어 baseline을 247로 동기화 + InspectorPageTab/FlatLayoutOverlay 2개 lint error에 eslint-disable 주석 추가. 실제 동작 영향 0. |

## 남은 것

### 미완료 (세션 교체 시 첫 작업, 현재 세션에서 그대로 이어가도 됨)

1. **gmail mockup WIP 처리** — working tree에 커밋되지 않은 변경이 있음. mockup 스킬의 low-fi 사다리 작업물로 보임:
   - `src/pages/__mockup__/gmail/` (신규): DataInspector, PageLow, WireframeWidgets, schema/layout/fixtures
   - `src/pages/showcase/gmail/*` (수정): PageGmail, gmailFixtures, gmailWidgets + 신규 gmailContext
   - `src/router.tsx`: __mockup__ 라우트 추가
   - `docs/2026/2026-04/2026-04-19/axNamingDictionary.md`, `gmailMockup.md`
   - `package.json` / `pnpm-lock.yaml`: 의존성 추가
   - **주의**: `WireframeWidgets.tsx:16` 에서 `textStyle` 타입 에러(control-group role에 존재하지 않는 prop) — 처음 push 시 막혔던 typecheck 실패 원인. mid-fi 진행 전에 해당 prop을 cs/tone/textStyle 중 맞는 축으로 교체 필요.

### 이후 (backlog)

- **Inspector 경고 2건**의 구조적 해소 — 지금은 eslint-disable로 봉인했지만:
  - `InspectorPageTab.tsx`: `useInspectorPage` hook을 별도 파일(`inspectorPageContext.ts`)로 분리하는 게 정석
  - `FlatLayoutOverlay.tsx`: `setBoxes([])` 초기화를 effect 대신 `useSyncExternalStore` 패턴으로 이관

## 컨텍스트

- **원인 파일**: `src/interactive-os/ui/SplitPane.tsx:196-202`
- **영향받는 레이아웃**: Finder `main` split (tree-area + preview). 유사 구조가 있는 CMS/Chat cmux 레이아웃도 동일한 이득을 받음.
- **검증 방법**: `/finder/src` 열고 `pages` 펼친 뒤 내부 파일 클릭 → preview 패널이 처음 나타나는 순간에도 `pages` expand 유지되는지 확인 (이전엔 접혔음).
- **관련 memory**: `feedback_focus_principles`, `feedback_flatlayout_model`

### 주의

- gmail mockup의 `textStyle` 타입 에러는 이 세션에서 발견했지만 본 버그 수정과 독립. mid-fi 단계에서 같이 정리하면 됨.
- pre-push ratchet(`ci-baseline.json`)은 inspector 누적 regression으로 이미 한 번 수동 동기화했음. 다음에 warnings을 실제로 줄이면 `pnpm baseline:ci`로 자동 lock 가능.

## 이어받는 법 (다음 세션 AI가 읽을 지시문)

세션이 교체되어 이 handoff를 새 세션이 집어가면 `/handoff` Step B가 동작한다.

구체적 첫 행동: `git status`로 gmail mockup WIP 확인 → `/mockup` 스킬로 mid-fi 단계 진입 (또는 사용자 의도 재확인). `WireframeWidgets.tsx:16`의 `textStyle` 축 수정을 먼저 하면 typecheck이 풀려 저장소가 clean해진다.
