---
id: 0-inbox/handoff-2026-04-17-subagent-viewer
title: 'Handoff: SubAgent Viewer (Blueprint PRD 파이프라인 첫 완주)'
status: inbox
kind: handoff
created: 2026-04-17
updated: 2026-04-18
summary: 'replay/live에서 SubAgent(Task) 내부 tool 동작을 부모 옆 가로 고정폭 viewer로 띄우는 기능 구현. 동시에 /prd 스킬을 Blueprint 형식으로 재설계하고 /handoff에 A0 역PRD 감사 게이트 전면 배치.'
topics: [0-inbox]
relates: []
supersedes: []
legacy:
  created_at: 2026-04-17
  session_id: subagent-viewer-blueprint
---
# Handoff: SubAgent Viewer (Blueprint PRD 파이프라인 첫 완주)

> replay/live에서 SubAgent(Task) 내부 tool 동작을 부모 옆 가로 고정폭 viewer로 띄우는 기능 구현. 동시에 /prd 스킬을 Blueprint 형식으로 재설계하고 /handoff에 A0 역PRD 감사 게이트 전면 배치.

## 완료

| 커밋 | 내용 |
|------|------|
| `121149ae` (aria) | SubAgent viewer 구현 11 파일 신규 + 6 파일 수정, 21 unit tests |
| `b960d27` (plugin-repo) | /prd Blueprint 재설계 + /handoff A0 게이트 |

### 구현 파일

**신규** (replay):
- `subAgentTypes.ts` — 타입 SSOT
- `parseSubAgentMeta.ts` / `buildSubAgentSession.ts` / `matchSubAgents.ts`
- `useSubAgentSessions.ts` / `subAgentContext.ts`
- `SubAgentStageWidget.tsx`
- `*.test.ts` × 4 (21 tests)

**수정**: `parseJsonl.ts`(sidechainOnly 옵션), `useActiveSessions.ts`(ActiveSessionWithSubs), `replayContext.ts`, `PageReplay.tsx`(가로 row), `replayStages.css`, `viewer/groupEvents.ts`(TimelineEvent optional 필드), `vite-plugin-agent-ops.ts`(subagents 스캔 + tail API)

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **브라우저 수동 검증** — `pnpm dev` 후 `/replay` live 모드에서 실제 SubAgent 발생 시 가로 row 자동 추가 확인 (V11)
2. **screen-test 통합** — `/screen-test` 스킬로 V4(orphan 뱃지) / V5(완료 뱃지) / V6(100개 스크롤) / V10(replay 모드) 검증

### 이후 (Phase 2 백로그)
- `useSubAgentSessions` integration test (fetch mock, V2/V7/V8/V11/V12)
- V14 grep assertion (매칭 SSOT 정적 검사)
- E9 재귀 sub-of-sub 처리
- `useParsedJsonl` 시그니처는 Blueprint §3 잔재 — 실구현 안 함 (§7에 🚫 표기)

## 컨텍스트

- **Blueprint PRD**: `docs/1-projects/replay/prds/subagent-viewer-prd.md` (전체 완성도 🟢 6/6, 원칙 감시자 🟢)
- **역PRD 체크리스트 (§7)**: 데이터 6/6 🟢, Export 10/11 🟢 1🚫, 검증 7/14 🟢 (나머지 Phase 2 skip)
- **새로운 파이프라인 운영**: discuss → /prd(Blueprint) → /do → /handoff(A0 역PRD 감사)
- **주의**: TimelineEvent에 optional 필드 3개(uuid/parentUuid/description) 추가됨. 기존 groupEvents 사용자 영향 없음 (optional)

## 이어받는 법

다음 세션에서 `/handoff`를 치면 이 파일을 자동으로 찾아 읽는다.
구체적 첫 행동: `pnpm dev` 후 replay 페이지에서 실제 Task 도구 사용하는 세션 live 관찰, SubAgent row 자동 추가 여부 확인.
