---
name: go
description: Discussion 종료 후 자율 실행. superpowers 파이프라인을 상황 판단하여 Plan → Execute → Verify를 자율 완주한다. 사용자가 "/go"를 입력하거나 discussion 이후 실행을 요청할 때 사용.
---

## 역할

Discussion에서 정렬된 의도를 바탕으로, 필요한 superpowers phase를 판단하여 자율 완주한다. 사람 개입 없이 끝까지.

## Step 0: 상황 판단

대화 컨텍스트(Discussion 이해도 테이블, 사용자 요청)에서 작업 규모를 판단하고, 필요한 phase를 선택한다.

| 신호 | Phase 선택 |
|------|-----------|
| 새 파일 3개+ 또는 새 모듈/behavior/아키텍처 | Plan → Execute → Verify |
| 기존 파일 수정, 범위 명확, 단일 task | Execute → Verify |
| Discussion에서 이미 plan 수준 상세도 나옴 | Execute → Verify (plan 스킵) |
| 버그 수정, 디버깅 | Debug → Verify |

판단 결과를 한 줄로 선언한다:

```
판단: [규모] — Phase: [선택된 phase 나열]
```

## Phase: Plan

복잡한 작업일 때만 실행. `superpowers:writing-plans` 스킬을 호출한다.

- 산출물: `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
- 이 파일이 Execute phase의 입력

## Phase: Execute

작업 규모에 따라 실행 방식을 선택한다:

| 조건 | 실행 방식 |
|------|----------|
| 멀티 task, 독립 분리 가능 | `superpowers:subagent-driven-development` — task별 서브에이전트 |
| 단일 task 또는 긴밀한 의존 | 직접 구현 (TDD 적용) |

서브에이전트는 plan.md를 읽고 task별로 디스패치한다. 각 서브에이전트: 구현 → 스펙 리뷰 → 품질 리뷰.

## Phase: Debug

버그/디버깅 작업일 때. `superpowers:systematic-debugging` 또는 `reproduce-first-debugging` 호출.

## Phase: Verify

**항상 실행.** 아래 단계를 순서대로 수행한다.

### Step 1: 기본 검증
- `tsc --noEmit` — TypeScript 에러 0
- `eslint` — lint 에러 0
- `vitest run` — 테스트 전체 통과

하나라도 실패하면 → 수정 후 재검증

### Step 2: /naming-audit
- CLEAN이면 → Step 3으로
- 불일치 발견 → 수정 후 Step 1 재검증

### Step 3: /simplify
- 수정 사항 없으면 → Step 4로
- 수정 발생 → Step 1 재검증

### Step 4: Code Review
- `superpowers:requesting-code-review` 호출 (서브에이전트)
- 피드백 있으면 반영 후 Step 1 재검증

### Step 5: PROGRESS.md 업데이트
- `docs/PROGRESS.md` 체크리스트에 완료 항목 반영

### Step 6: 커밋
- 변경사항 커밋

## Phase: Retro (PRD가 있을 때만)

**조건:** `docs/superpowers/specs/*-prd.md`가 이번 사이클에서 사용되었으면 실행. PRD 없는 작업(단순 버그 수정, 디버깅)은 스킵.

`/retro` 스킬을 호출한다:

1. **Blind 역PRD** — fresh 서브에이전트가 git diff만 보고 역PRD 생성 (원본 PRD 미제공)
2. **PRD diff** — 원본 PRD와 항목별 비교
3. **5계층 분류** — L1(코드), L2(PRD 스킬), L3(스킬), L4(지식), L5(사용자 피드백)
4. **보고서 생성** — `docs/0-inbox/`에 retro 보고서
5. **L1 백로그 처리** — 코드 갭은 자율 수정 → 재Verify (Step 1~4 반복)
6. **L2~L5 제안** — 보고서에 기록, 커밋 메시지에 요약

L1 백로그를 처리한 후에는 **Step 1(기본 검증)부터 다시 실행**한다.

## Ralph Loop 기동

상황 판단 후 `ralph-loop:ralph-loop` 스킬을 호출하여 Ralph Loop을 시작한다. Ralph Loop 내에서 위 Phase들을 순서대로 실행한다.

Args: `[작업 설명] --completion-promise 'done' --max-iterations 20`

## 종료 조건

Verify phase + Retro phase(해당 시)를 모두 통과했을 때만:

<promise>done</promise>

## 절대 규칙

- Verify phase를 모두 통과하지 않으면 promise를 출력하지 않는다
- "할 일이 없다"고 판단되어도 Verify phase는 반드시 실행한다
- 거짓 promise 출력 금지 — 검증 실패 상태에서 done을 출력하면 안 된다
- 검증 통과 후에는 즉시 promise를 출력한다 — 불필요한 이터레이션을 돌지 않는다
