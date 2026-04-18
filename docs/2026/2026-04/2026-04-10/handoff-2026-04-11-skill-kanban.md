---
id: 4-archive/meta/archive/handoff-2026-04-11-skill-kanban
type: handoff
slug: skillKanban
title: 'Handoff: Skill Kanban v1 완성 → 상품성 개선 계속'
tags: [untagged]
created: 2026-04-10
updated: 2026-04-11
summary: '2026-04-11 세션에서 Skill Kanban 페이지를 discuss→PRD→구현→상품성 개선까지 진행'
legacy:
  consumed_by: '38aac4f5 — Agent Dashboard 재설계로 v1 handoff 항목 해소'
  status: archived
  kind: handoff
  topics: [4-archive]
  relates: []
  supersedes: []
---
# Handoff: Skill Kanban v1 완성 → 상품성 개선 계속

> 2026-04-11 세션에서 Skill Kanban 페이지를 discuss→PRD→구현→상품성 개선까지 진행

## 완료

| 커밋 | 내용 |
|------|------|
| `6c9419df` | Skill Kanban 전체 구현 — 세션 기반 3컬럼, 실시간 SSE, dialog, 훅 규칙 |

### 구현된 것
- **2경로 실시간 아키텍처**: 훅→POST→vite SSE (즉시) + .jsonl→timeline API (히스토리)
- **세션=카드 모델**: 세션 단위 카드, 마지막 스킬이 컬럼 결정 (Planning/Running/Done)
- **카드 본문**: 마지막 메시지 3줄 MarkdownViewer 렌더링
- **대화 dialog**: 카드 클릭 → fvm-dialog 패턴으로 전체 대화 열람
- **네비 등록**: ActivityBar에 SquareKanban 아이콘
- **훅 규칙 21**: 글자(×) 닫기 버튼 차단 → CloseIndicator 사용 강제
- **PRD**: `docs/2-areas/devtools/prds/skill-kanban-prd.md`

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **active 세션 필터링 문제** — `useActiveSessions`가 active만 반환하여 비활성 세션 카드가 안 보임. 칸반 모델에서는 Done으로 명시적 이동 전까지 카드가 유지되어야 함 — `docs/2-areas/devtools/prds/skill-kanban-prd.md` ④경계 참조
2. **Verify phase 미완** — /simplify, /naming-audit, screen-test 미실행
3. **Retrospect 미완** — PRD 역PRD 열 미기입

### 이후
- **카드 제목 개선** — `lastUserMessage`가 너무 짧거나 의미 없는 경우("ok") 대응. 첫 의미 있는 메시지를 fallback으로
- **비활성 세션 Done 판정** — active: false인 세션을 자동으로 Done으로 처리할지, 별도 상태로 둘지
- **실시간 POST 테스트** — 훅이 실제로 PreToolUse에서 skill_start를 보내는지 실환경 확인 (이번 세션에서는 .jsonl 경로만 검증됨)
- **빈 공간 활용** — 카드가 적을 때 화면 대부분이 비어 보이는 문제

## 컨텍스트

- **PRD**: `docs/2-areas/devtools/prds/skill-kanban-prd.md`
- **관련 memory**: `project_skill_kanban_model.md` — 카드=세션, 컬럼=파이프라인 단계
- **주의**: PRD ⑦ "Kanban.tsx 수정 금지" 규칙이 있었으나 현재 코드는 Kanban.tsx를 사용하지 않고 직접 렌더링 (본문 3줄 표시 요구로 전환). PRD 갱신 필요.

## 다음 행동 제안

`/go`로 시작하면 이 handoff를 자동으로 픽업한다.
구체적으로: `/simplify` → `/naming-audit` → useActiveSessions 필터링 수정 (비활성 세션도 포함)

#kind/handoff #archived
