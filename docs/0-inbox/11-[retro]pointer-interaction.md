# Retro: Pointer Interaction — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-pointer-interaction-prd.md
- **Diff 범위:** a084576^..40522a4
- **커밋 수:** 2
- **변경 파일:** 10 (src/interactive-os)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | 🔀 | 6개 중 5개 일치. #6 Grid 클릭 테스트 미작성 | L1 |
| 2 | 인터페이스 | ⚠️ | 핵심 일치. onPointerDown ctx 캡처, modifier→activate 억제는 PRD에 없었음 | L2 |
| 3 | 산출물 | 🔀 | `toggleExpand: true` → `onClick: true` only (의도적 변경, 더 올바름). pointerDownCtxRef 산출물 PRD에 없음 | L2 |
| 4 | 경계 | ❌ | disabled 노드 테스트 미구현 | L1 |
| 5 | 금지 | 🔀 | #1 preventDefault 금지 — 실제: 버블링 가드로 사용 (목적이 다름, 문제 아님) | — |
| 6 | 검증 | ❌ | #7 Grid, #11 disabled — 테스트 미작성 | L1 |

**일치율:** 4/6

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
- Grid 셀 클릭 테스트 (L1) — grid behavior는 `select()` 축을 사용하므로 selectOnClick은 자동 동작하지만, 검증 테스트가 없음
- disabled 노드 클릭 테스트 (L1) — 코드에 disabled 가드가 있는지 불명확, 테스트로 검증 필요

### ⚠️ 구현됐는데 PRD에 없었음
- `onPointerDown` ctx 캡처 — anchorResetMiddleware와의 이벤트 타이밍 문제는 구현 단계에서 발견. PRD가 이벤트 순서 분석을 요구하지 않았음
- modifier 클릭 시 activate 억제 — Shift+Click으로 selection하면서 activate(expand 토글)도 실행되면 의도치 않은 동작. Plan review에서 발견
- `setAnchor(id)` 배치 — PRD의 onClick 순서에 anchor 설정이 빠져있었음

### 🔀 의도와 다르게 구현됨
- `activate({ onClick: true, toggleExpand: true })` → `activate({ onClick: true })` — plan review에서 `toggleExpand`가 expandable=true를 설정하여 leaf에도 aria-expanded 노출하는 문제 발견. `ctx.activate()`가 이미 children 체크로 분기하므로 불필요. **결과가 더 올바름.**

## 계층별 개선 제안

### L1 코드 — /backlog
- [ ] Grid 셀 클릭 → 행 선택 테스트 추가
- [ ] disabled 노드 클릭 → 무동작 테스트 추가

### L2 PRD 스킬
- PRD 인터페이스 항목에서 "브라우저 이벤트 순서(pointerdown→focus→click)"를 고려하지 않음. 포인터/클릭 관련 PRD에서는 이벤트 타이밍 분석이 필요.
- PRD 산출물에서 "plan review 단계의 설계 변경"을 역추적할 수 없음. PRD 산출물은 plan review 후 갱신되어야 함.

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 백로그 2건 → /backlog에 저장
