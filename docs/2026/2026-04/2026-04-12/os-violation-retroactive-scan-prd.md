---
id: 2-areas/harness/prds/os-violation-retroactive-scan-prd
type: prd
slug: osViolationRetroactiveScan
title: 'OS Violation Retroactive Scan — PRD'
tags: [m]
created: 2026-04-12
updated: 2026-04-12
summary: 'Discussion: 기존 PreToolUse 훅 2개(guardOsPatterns, guardCssAxes)를 소급 적용하여 src/ 전체의 축적된 os 위반을 가시화·수렴한다. `pages/` → `ui/` → `primitives/` 순서 레이어별 청소.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, m]
  relates: []
  supersedes: []
---
# OS Violation Retroactive Scan — PRD

> Discussion: 기존 PreToolUse 훅 2개(guardOsPatterns, guardCssAxes)를 소급 적용하여 src/ 전체의 축적된 os 위반을 가시화·수렴한다. `pages/` → `ui/` → `primitives/` 순서 레이어별 청소.

## ① 동기

### WHY

- **Impact**: os 규칙이 23+개로 누적됐지만 훅은 PreToolUse 방식으로 "새로 쓰는 코드"만 막는다. 훅 도입 이전 코드는 위반이 남아있고, 개발자(AI+사람)는 기존 파일을 열 때만 사후적으로 발견한다. 누적 위반 수가 보이지 않으면 `feedback_harness_convergence` ("부품이 쌓이면 훅이 자동 안내")가 불완전해진다.
- **Forces**: (충돌) 훅 본체를 건드리면 PreToolUse 계약이 깨질 위험 ↔ 배치 모드가 필요. (제약) 훅 로직 재구현 금지(SSOT 이중화), modified 파일 30+개 작업 중이므로 보존, useState 규칙(9)은 상태 소유권 재설계가 필요해 기계적 수정 불가.
- **Assets**: `guardOsPatterns.mjs`(23규칙), `guardCssAxes.mjs`, `scripts/designLintRunner.mjs`(stdio 파이프 패턴 참조), `scripts/checkTestComponents.mjs`(재귀 수집 패턴), `pnpm check:*` 등록 컨벤션, `/antipattern` 스킬. 외부 레퍼런스 불필요.
- **Decision**: runner 스크립트가 각 파일을 `{tool_name:'Write', tool_input:{file_path, content}}` JSON으로 포장해 훅에 stdin 주입 → stdout 파싱 → 레이어별 리포트 생성 → 파일별 수정 → 재스캔 0 수렴. **기각 대안**: (a) 훅에 `--scan` 플래그 추가 — PreToolUse 계약 위험, (b) eslint 규칙 포팅 — SSOT 이중화, (c) grep 직접 검사 — 훅의 예외 로직(`_isAriaZoneFile`, `isExempt`) 복제 불가.
- **Non-Goals**: 새 훅 규칙 추가 금지(B 트랙), useState 규칙 9 일괄 치환 금지(별도 사이클), `interactive-os/`·`styles/`·inspector overlay 자동 면제(훅 로직 그대로 상속), 테스트 파일 미검사.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | `src/` 전체에 누적 위반 수 미지 | 개발자가 `pnpm scan:violations`를 실행 | 레이어별 `violations-{layer}.md` 리포트가 생성되어 위반 수·파일·규칙별 분포를 확인할 수 있다 | |
| 2 | `violations-pages.md`에 N건의 위반 | 개발자가 리포트를 보고 파일별로 수정 | 재스캔 시 해당 레이어 위반 0으로 수렴 | |
| 3 | runner가 훅을 그대로 호출 | 훅이 수정되면 runner 결과도 자동으로 같이 변함 | SSOT 유지. runner가 훅 로직을 복제하지 않는다 | |
| 4 | modified 파일에 위반이 있다 | runner가 리포트에 `[M]` 플래그로 표시 | 개발자가 동시 작업 충돌 여부를 먼저 확인하고 진행할 수 있다 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `scripts/scanOsViolations.mjs` | 새 runner. 인자: `--layer pages\|ui\|primitives\|all`. 파일 수집 → 훅 stdin 주입 → stdout 파싱 → 리포트 생성 | |
| `package.json::scripts.scan:violations` | `node scripts/scanOsViolations.mjs --layer $LAYER` 실행 엔트리 | |
| `docs/2-areas/harness/reports/violations-pages.md` | pages 레이어 위반 리포트. runner가 매 실행마다 덮어쓰기 | |
| `docs/2-areas/harness/reports/violations-ui.md` | ui 레이어 위반 리포트 | |
| `docs/2-areas/harness/reports/violations-primitives.md` | primitives 레이어 위반 리포트 | |

**수정 대상**(코드 변경이지만 산출물 아님): 각 레이어의 위반 파일들. 리포트가 안내한 규칙별 대체(예: `style={{}}` → `ax()`, 이모지 → `ui/indicators/`)를 수동 적용.

완성도: 🟢

## ③ 인터페이스

runner는 CLI 도구. 입력=CLI 인자 + 파일시스템, 출력=stdout + 리포트 파일.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `pnpm scan:violations --layer pages` | 리포트 없음 | 1) `src/pages/` 재귀 수집 2) 훅 제외 규칙 적용(node_modules, .test., __tests__, tokens.css, interactive-os/, styles/, inspector overlay) 3) 각 파일에 대해 `guardOsPatterns.mjs`와 `guardCssAxes.mjs`를 child_process로 실행하고 stdin에 합성 JSON 주입 4) stdout JSON `{decision:'block', reason}` 파싱 5) 파일별·규칙별 집계 → `violations-pages.md` 작성 | 훅 로직은 PreToolUse 경로와 동일하게 재사용되어야 함(SSOT). child_process + stdio가 훅 계약을 건드리지 않으면서 로직을 재사용하는 최소 접점 | `violations-pages.md` 존재, stdout에 "pages: N violations in M files" 출력, exit 0 | |
| `pnpm scan:violations --layer all` | — | pages → ui → primitives 순차 실행, 3개 리포트 + 합계 stdout | 레이어별 독립 수정·커밋 지원 | 3개 리포트 생성, 합계 출력, exit 0(위반 여부와 무관) | |
| `pnpm scan:violations --layer pages --fail-on-violation` | — | 위반 0이면 exit 0, 1건 이상이면 exit 1 | CI/pre-commit 단계 진입 가능성 확보(비의무) | 리포트 + exit 1 | |
| 훅 child_process가 exit 0 + stdout 빈 응답 | — | 위반 없음으로 집계 | 훅은 block 시에만 stdout을 쓴다 | 파일 카운트만 증가 | |
| 훅 child_process가 stdout에 `{decision:'block', reason}` 출력 | — | JSON parse → reason 멀티라인 파싱 → 규칙별 라인 집계(`^\s*\d+\. .+`) | 훅 reason 형식 고정 | 리포트 엔트리 추가 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 파일이 제외 경로(`interactive-os/`, `styles/`, inspector overlay, `.test.`, `__tests__`, `node_modules`, `tokens.css`) | — | 훅도 이 경로를 exit 0으로 면제한다. runner는 훅을 그대로 호출하므로 자동 면제된다 — **runner 측에서 중복 면제 로직을 두지 않는다** (SSOT) | child_process가 exit 0, stdout empty → 위반 없음으로 집계 | 위반 수에 포함 안 됨 | |
| 파일이 modified(git) | — | 동시 작업 중일 수 있으므로 개발자가 충돌 여부를 먼저 확인해야 한다 | 리포트에 `[M]` 플래그 표시. 수정 스킵은 안 함 | 리포트 플래그 | |
| 파일이 untracked(git) — CopyButton.tsx, PageIncidentFlat.tsx 등 | — | 신규 파일도 동일하게 검사 대상 | 리포트에 `[?]` 플래그 표시 | 리포트 플래그 | |
| 훅 child_process가 비정상 종료(stdout JSON parse 실패) | — | 훅 버그 감지 필요. 무시하면 false negative | stderr에 파일 경로 + raw stdout 출력, 해당 파일은 "parse-error"로 집계. 전체 프로세스는 계속 | 리포트에 parse-error 섹션 | |
| 한 파일에 여러 규칙 위반 | — | 훅 reason은 "os 위반 N건 감지"로 통합해 반환 — 각 라인을 별도 규칙으로 집계 | reason 본문의 `^  \d+\. ` 라인마다 개별 위반으로 카운트 | 파일당 위반 수 > 1 | |
| 파일이 `.css`인 경우 | — | `guardCssAxes.mjs`가 담당. `guardOsPatterns.mjs`는 규칙 14(CSS ax 위반)가 있지만 중복 체크는 문제 없음 | 두 훅 모두 호출, 위반 합산 | 리포트에 양쪽 규칙 | |
| 파일이 `@useState-hatch` 주석 사용 | — | 훅 규칙 9가 면제한다 — runner는 훅을 그대로 호출하므로 자동 면제 | 위반 없음 | 집계 제외 | |
| runner 실행 중 훅 파일이 수정됨 | — | child_process는 실행 시점의 파일을 로드 — 일관성 유지 | 영향 없음 | — | |
| `--layer all`에서 중간 레이어가 실패(I/O 에러) | — | 원자적 실행이 아니어도 레이어 단위 독립 리포트는 유효하므로 계속 진행 | 실패 레이어는 리포트 미생성, stderr 에러, 다른 레이어는 진행 | 부분 리포트 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | `feedback_harness_convergence` — 하네스는 금지가 아닌 수렴 | runner 리포트 내용 | ❌ 위반 아님 — 리포트는 훅 reason(이미 수렴 안내 포함)을 그대로 출력 | — | |
| 2 | `feedback_reuse_existing_impl` — 새로 만들기 전 기존 구현 재활용 | runner 구조 | ❌ 위반 아님 — 훅 본체를 child_process로 재사용, 로직 복제 없음 | — | |
| 3 | `feedback_atomic_restructure` — 대규모 리팩토는 원자적 | 위반 수정 단계(Step 2) | ⚠️ 잠재 위반 — 레이어별 분할이 원자성 약화 | 레이어 단위를 "원자"로 재정의. 한 레이어 수정은 한 세션·한 커밋 안에서 끝낸다 | |
| 4 | `feedback_declarative_ocp` — switch-case dispatcher 금지 | runner 구조 | ❌ 위반 아님 — 훅 호출은 단일 경로, 레이어 분기는 CLI 인자 테이블 | — | |
| 5 | `feedback_minimum_impl_is_good` — 최소 구현 | runner 기능 | ❌ 위반 아님 — "발견+출력"만, 자동 수정 없음 | — | |
| 6 | `feedback_parallel_session_worktree` — 병렬 세션은 worktree 격리 | Step 2 수정 실행 | ⚠️ 잠재 위반 — modified 파일과 충돌 가능 | 리포트 `[M]` 플래그 확인 후, 필요 시 worktree 격리로 수정 | |
| 7 | `feedback_fix_root_not_symptom` — 현상 수정 금지 | Step 2 수정 실행 | ⚠️ 잠재 위반 — 규칙 6/7(role/aria-*) 기계적 제거는 설계 의도 왜곡 가능 | role/aria-* 위반은 ui 컴포넌트 교체로만 해결. 단순 삭제 금지 | |
| 8 | `feedback_fix_requires_design_understanding` — 수정 전 설계 이해 | Step 2 | ⚠️ 잠재 위반 — 규칙 4(style={{}}) 자동 치환이 값 매핑 오류 가능 | 리포트에 style 블록 내용을 함께 출력. 개발자가 ax() 토큰 매핑을 직접 판단 | |
| 9 | `feedback_self_verify` — 테스트 통과=완료 | 검증 단계 | ❌ 위반 아님 — 재스캔 위반 0 + pnpm test/typecheck 통과로 검증 | — | |
| 10 | `feedback_all_state_normalized_command` — useState 전면 금지 | 규칙 9 위반 수정 | ⚠️ 분리 트랙 — 상태 소유권 재설계 필요 | 규칙 9만 별도 PRD로 분리(범위 관리) | |
| 11 | `feedback_ui_over_primitives` — pages에서 primitives 직접 금지 | 규칙 1, 2 위반 수정 | ⚠️ 잠재 위반 — pages의 `useAria` 직접 사용을 ui 컴포넌트로 교체 | 이미 훅 규칙 1, 2가 감지. 교체 시 ui CATALOG 참조 | |
| 12 | CLAUDE.md "제1원칙: 있는 걸로 만든다" | Step 2 위반 수정 | ❌ 위반 아님 — 훅 reason이 이미 "ui 완성품을 사용하세요: [목록]" 안내 | — | |

**⑤에서 발견한 설계 수정**: 규칙 9(useState)는 ② 산출물에서 제외하고 "범위 관리"로 별도 분리. ④ 경계에 `@useState-hatch` 면제 자동 상속이 이미 기록됨.

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | 훅 파일 자체(`guardOsPatterns.mjs`, `guardCssAxes.mjs`) | 훅이 PreToolUse 외 경로(child_process stdin)로도 호출됨 | 저 | 훅은 stdin JSON → stdout JSON 형식만 보장하면 되고, 현재 훅은 순수 함수 구조 — 영향 없음 | |
| 2 | `package.json::scripts` | 새 엔트리 `scan:violations` 추가 | 저 | 기존 스크립트 네이밍(`check:*`, `lint:*`)과 일관, 부작용 없음 | |
| 3 | `docs/2-areas/harness/reports/` | 새 디렉토리 + 생성 리포트 파일 3개 | 저 | `.gitignore`에 `violations-*.md` 등록 여부 결정 필요(결정: 커밋해서 이력 추적) | |
| 4 | 수정 대상 파일(pages 6, ui 10, primitives 2 modified + 전체 중 위반 파일) | 코드 의미 변화 가능성 | 중 | 레이어별 커밋 단위. 테스트 + typecheck 통과 확인 후만 다음 레이어. 실패 시 `git checkout -- {내 파일}` | |
| 5 | 규칙 9(useState) 수정 | 상태 소유권 재설계 → SSE/타이머 등 side effect 재배치 | 고 | ② 산출물에서 제외. 별도 PRD로 분리 → `docs/2-areas/harness/prds/usestate-migration-prd.md`(미작성) | |
| 6 | modified 파일과 동시 작업 | 레이어별 일괄 수정이 진행 중인 다른 작업과 충돌 | 중 | 리포트 `[M]` 플래그 + 수정 전 `git status` 확인. 충돌 시 worktree 격리 | |
| 7 | 규칙 4(style={{}}), 규칙 16(raw form) 수정 | ax() 토큰 매핑 오류, ui 폼 컴포넌트 미존재 가능 | 중 | 리포트에 style 블록/태그 내용을 함께 출력. ui/ CATALOG 확인 후 수동 매핑 | |
| 8 | 훅 reason 형식 변경 | runner 파서 깨짐 | 저 | 훅 reason 파싱은 "reason 전체를 그대로 출력 + `^\s*\d+\. ` 라인 카운트"만 사용 — 형식 변동성 낮음 | |
| 9 | `ui/` 326개 파일 전부 스캔 | runner 실행 시간 길어짐 | 저 | child_process 병렬화 불필요(개발 도구, 1회성). 순차 실행 수초~수십초 예상 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | runner에서 훅 규칙 로직을 재구현 | ⑤-2 재활용 원칙 | SSOT 이중화 위험. 훅 본체는 child_process로 호출만 | |
| 2 | runner가 파일을 직접 수정 | ⑤-5 최소 구현 | "발견+출력"만. 자동 수정은 범위 밖 | |
| 3 | 훅에 `--scan` 플래그 등 배치 모드 추가 | ⑦ 제약(⑥-1) | PreToolUse 계약 변경 위험 | |
| 4 | 규칙 9(useState) 위반을 Step 2에서 기계적으로 치환 | ⑤-10, ⑥-5 | 상태 소유권 재설계 필요. 별도 트랙 | |
| 5 | 규칙 6/7(role/aria-*) 위반을 삭제로만 해결 | ⑤-7 | 설계 의도 왜곡. ui 컴포넌트 교체로만 해결 | |
| 6 | 여러 레이어를 하나의 커밋으로 묶음 | ⑤-3, ⑥-4 | 원자성 약화, rollback 단위 불명확. 레이어 = 커밋 단위 | |
| 7 | runner 측에서 제외 경로를 다시 필터링 | ⑤-2, ⑥-8 | 훅이 이미 면제 — 중복은 SSOT 위반, 훅 변경 시 둘이 엇갈림 | |
| 8 | 테스트 실행 없이 레이어 커밋 | ⑤-9 | 회귀 감지 불가. `pnpm test && pnpm typecheck` 통과 필수 | |
| 9 | `git stash` 전체 원복으로 대응 | CLAUDE.md 원복 정책 | 동시 작업 파일 손실. `git checkout -- {내 파일}` 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①-1 | runner를 처음 실행 | `violations-{layer}.md` 파일 생성, stdout에 "N violations in M files" | |
| 2 | ①-2 | 레이어의 모든 위반 파일을 수정 후 재실행 | 해당 리포트 "0 violations", exit 0 | |
| 3 | ①-3 | 훅에 새 규칙을 추가(임시) → runner 재실행 | 새 규칙 위반이 리포트에 자동 반영 — 로직 복제 없음 증명 | |
| 4 | ①-4 | git status에 modified 파일이 있는 상태 | 리포트의 해당 파일 라인에 `[M]` 플래그 | |
| 5 | ④-1 | `src/interactive-os/ui/TreeGrid.tsx` 스캔 | 면제(훅 자동) → 위반 0 | |
| 6 | ④-4 | 훅을 고의로 망가뜨린 상태(비정상 stdout) | "parse-error" 섹션에 파일 기록, 전체 exit 0, 다른 파일은 정상 | |
| 7 | ④-5 | 파일 한 개에 `style={{}}` 2곳 + 이모지 1개 | 파일당 3개 위반으로 카운트, 리포트에 규칙별 분류 | |
| 8 | ④-7 | `@useState-hatch` 주석 달린 파일 | 위반 0 | |
| 9 | ⑥-4 | pages 레이어 수정 완료 후 `pnpm test && pnpm typecheck` | 둘 다 통과 | |
| 10 | ⑥-6 | modified 파일과 비-modified 파일 중 둘 다 위반 | 리포트는 둘 다 표시, 개발자가 비-modified부터 수정 | |
| 11 | ①×④ 교차 | `pnpm scan:violations --layer all` | pages, ui, primitives 3개 리포트 모두 생성, 합계 stdout | |
| 12 | ⑦-1 금지 확인 | runner 소스 grep `replace|transform|write.*src/` | 매치 없음 — 자동 수정 로직 부재 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: 시나리오 1→검증1, 2→검증2, 3→검증3, 4→검증4. 모두 커버 ✓
2. **인터페이스 ↔ 산출물**: `pnpm scan:violations` 엔트리 ↔ `package.json::scripts.scan:violations`, 리포트 생성 ↔ `violations-{layer}.md` 산출물 ✓
3. **경계 ↔ 검증**: ④-1(제외)→⑧-5, ④-4(parse-error)→⑧-6, ④-5(다중 위반)→⑧-7, ④-7(hatch)→⑧-8 ✓
4. **금지 ↔ 출처**: 9개 금지 항목 모두 ⑤ 원칙 또는 ⑥ 부작용에 출처 기재 ✓
5. **원칙 대조 ↔ 전체**: ⑤-10(useState 분리)이 ② 산출물·⑦-4 금지에 반영되어 일관 ✓

## 범위 관리

- **분리된 PRD(미작성)**: `docs/2-areas/harness/prds/usestate-migration-prd.md` — 규칙 9 위반의 상태 소유권 재설계. 본 PRD 완료 후 착수.

## 리서치 요약

- **구현 탐색**: `scripts/`에 18개 기존 MJS, `designLintRunner.mjs`가 stdio 파이프 패턴 레퍼런스. 파일 규모 pages 133/ui 326/primitives 21=총 480. `pnpm check:*`/`lint:*` 컨벤션.
- **원칙 수집**: `harness_convergence`, `reuse_existing_impl`, `atomic_restructure`, `parallel_worktree`, `fix_root_not_symptom`가 이 작업의 핵심 가드레일. `minimum_impl_is_good`로 runner는 발견·출력만.
- **부작용 탐색**: 위반을 Group A(기계적: ememoji/stopPropagation/showModal — 저위험), Group B(토큰 매핑: style={{}}/raw form — 중위험), Group C(아키텍처: useState/role/aria — 고위험)로 분류. Group C 중 useState는 별도 트랙, role/aria는 ui 컴포넌트 교체로만.

## 다음 단계

① runner 구현 (`scripts/scanOsViolations.mjs` + `package.json` 엔트리)
② pages 레이어 스캔 → 수정 → 재스캔 0 → `pnpm test && pnpm typecheck` → 커밋
③ ui 레이어 동일 사이클
④ primitives 레이어 동일 사이클
⑤ 전체 재스캔으로 수렴 확인
