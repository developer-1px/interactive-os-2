---
id: 4-archive/meta/archive/handoff-2026-04-11-skill-kanban-v2
type: handoff
slug: skillKanbanV2
title: 'Handoff: Skill Kanban v2 — 2패널 모달 + 산출물 표시'
tags: [untagged]
created: 2026-04-11
updated: 2026-04-11
summary: '2026-04-11 세션에서 Skill Kanban v2 discuss→PRD→구현→simplify 완료. 브라우저 실사용 검증과 디자인 개선이 남음.'
legacy:
  consumed_by: '38aac4f5 — Agent Dashboard 재설계로 v2 handoff 항목 해소'
  status: archived
  kind: handoff
  topics: [4-archive]
  relates: []
  supersedes: []
---
# Handoff: Skill Kanban v2 — 2패널 모달 + 산출물 표시

> 2026-04-11 세션에서 Skill Kanban v2 discuss→PRD→구현→simplify 완료. 브라우저 실사용 검증과 디자인 개선이 남음.

## 완료

| 커밋 | 내용 |
|------|------|
| `6862e0dd` | Skill Kanban v2 — 2패널 모달 + 산출물/스킬 여정 표시 |

### 구현된 것
- **SessionCard 확장**: `skills[]`, `touchedFiles[]` 필드 추가. timeline 이벤트의 filePath 수집 (Edit/Write/Read 등)
- **카드 UI**: 스킬 breadcrumb (`discuss → prd → go`) + 파일명 목록 (최대 5개 + "+N more")
- **SessionDetailModal**: 풀스크린 2패널 SplitPane — 좌=채팅 MarkdownViewer, 우=TabList(파일 목록)+FilePreview(마크다운/코드 하이라이팅)
- **파일 프리뷰**: `/api/fs/file?path=` 기존 API 활용, 탭 클릭으로 전환
- **useActiveSessions**: `activeOnly` 옵션 추가 (비활성 세션도 칸반에 표시, Done 자동 판정)
- **PRD**: `docs/2-areas/devtools/prds/skill-kanban-v2-prd.md`

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **브라우저 실사용 검증** — `/use /kanban`으로 실제 동작 확인. SplitPane이 dialog 내부에서 처음 쓰이므로 높이/드래그 동작 검증 필수
2. **디자인 개선** — 카드와 모달의 시각 완성도. 현재 기능만 구현됨

### 이후
- **ax() Pit of Success 불변량 PRD** — `docs/2-areas/styles/prds/ax-pit-of-success-prd.md` 작성 완료 (다른 세션에서). 페어링/레벨/시드 3가지 불변량 도입. 별도 사이클로 실행
- **Skill Kanban v1 handoff 잔여** — `docs/0-inbox/handoff-2026-04-11-skill-kanban.md`의 실시간 POST 테스트, 빈 공간 활용 등 미해결 항목
- **Component Catalog handoff** — `docs/0-inbox/handoff-2026-04-11-component-catalog.md`의 Visual UI 레이어 작업

## 컨텍스트

- **PRD**: `docs/2-areas/devtools/prds/skill-kanban-v2-prd.md` — 8/8 🟢, 역PRD 미기입
- **v1 PRD**: `docs/2-areas/devtools/prds/skill-kanban-prd.md`
- **사용자 피드백**: "컨셉은 좋은데 기능적 완성도가 떨어져. 최종적으로 내가 보면 되는 것들이 잘 노출이 되었으면 한다" → 산출물(파일)+스킬 여정이 핵심
- **주의**: Dialog 내부 SplitPane은 프로젝트 내 전례 없음. CSS에서 `kanban-fullscreen-dialog`로 100dvw/100dvh 확보했지만 실사용 검증 필요

## 다음 행동 제안

`/use /kanban`으로 실사용 검증 먼저. 동작 확인 후 `/improve`로 디자인 품질 개선.

#kind/handoff #archived
