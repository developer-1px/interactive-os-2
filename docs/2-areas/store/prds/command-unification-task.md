---
id: 2-areas/store/prds/command-unification-task
title: 'Command Unification — Task'
status: active
kind: plan
created: 2026-04-03
updated: 2026-04-08
summary: 'PRD: `2026-04-03-command-unification-prd.md` 빅뱅 1커밋. 모든 useState → NormalizedData + Command.'
topics: [2-areas]
relates: []
supersedes: []
---
# Command Unification — Task

> PRD: `2026-04-03-command-unification-prd.md`
> 빅뱅 1커밋. 모든 useState → NormalizedData + Command.

## 공통 인프라

- [ ] `store/createSingleNodeStore.ts` — 단일/소수 노드 NormalizedData 헬퍼
- [ ] `axis/edit.ts` — edit 축: startEdit/commitEdit/cancelEdit, meta entity `__edit__`

## A. SpreadReader → useAria + navigate

- [ ] `ui/SpreadReader.tsx` — useState(spread/totalSpreads) 제거 → useAria + navigate. CSS 측정 → N개 노드 NormalizedData. AriaRoute 제거
- [ ] `pages/book/PageBookViewer.tsx` — SpreadReader 전환에 맞춰 props 조정
- [ ] `pages/viewer/widgets/FilePanel.tsx` — 동일

## B. Chat 블록 → disclosure 패턴

- [ ] `ui/chat/ThinkingBlock.tsx` — `<details>` + useState(open) → Aria + disclosure. isLatest→false 시 expandCommands.collapse
- [ ] `ui/chat/FallbackBlock.tsx` — 동일
- [ ] `ui/chat/ToolSummaryBlock.tsx` — ToolResultBlock, ToolGroup, ToolChainGroup 3곳 전환

## C. 축 부재 해소

- [ ] `ui/Spinbutton.tsx` — useState(editing/editValue/invalid) → edit 축 Command
- [ ] `ui/DatePicker.tsx` — useState(isOpen) → popup 축, useState(year/month) → calendar Command + TransformAdapter

## D. AriaRoute Command 전환

- [ ] `primitives/AriaRoute.tsx` — `() => void` → `() => Command | void`, Command 로깅
- [ ] `pages/cms/CmsLayout.tsx` — keyMap Command 반환
- [ ] `pages/viewer/PageViewer.tsx` — 동일
- [ ] `pages/book/PageBookViewer.tsx` — 동일 (A와 병합)
- [ ] `pages/viewer/widgets/FilePanel.tsx` — 동일 (A와 병합)

## 검증

- [ ] 기존 테스트 통과
- [ ] V1~V15 시나리오 검증
- [ ] chat 30블록 렌더 성능 실측
