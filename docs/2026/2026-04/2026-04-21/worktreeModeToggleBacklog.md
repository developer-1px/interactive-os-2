---
name: Worktree Mode Toggle Backlog
description: always-worktree 기본값 위에 1인 세션일 때 main 허용 토글을 얹는 후속 작업
type: backlog
layer: infra
status: pending
project: infra
tags: [worktree, hook, toggle, parallel-session, speed]
---

# Worktree Mode Toggle — Backlog

> **선행**: PR #10 (parallel-infra) 머지 후
> **동기**: 1인 세션에서도 worktree 세금이 붙어 속도 저하. 병렬일 때만 규율이 필요.

## 문제

- 현재 `requireWorktree.mjs`는 main Edit을 **무조건** 차단.
- `feedback_ratchet_convergence`: 엔트로피 반전 장치는 마찰을 동반한다.
- 1인 작업(동시 세션 0)에서도 worktree 생성·cd·commit cycle 오버헤드 지불.

## 설계 (3 옵션 + 권장)

### A) `ALLOW_MAIN=1` 상시 열기
- env 변수만으로 hook 무력화. 구현 0줄.
- 병렬 시 원래 문제 재발. **기각**.

### B) 1인 세션 자동 감지 (권장)
- `requireWorktree.mjs` 상단에 `scripts/activeSessions.sh` 호출.
- 다른 세션 0개면 `process.exit(0)`으로 통과.
- `guardBash.mjs`의 main commit/push 차단도 동일 조건으로 skip.
- 장점: 전환 자동, 의식 없음. 단점: activeSessions.sh의 세션 카운트 신뢰성 필요.

### C) 명시 모드 파일
- `.claude/worktree-mode.local`에 `strict|relaxed` 적어서 hook이 읽음.
- 장점: 의도 명시적. 단점: 매번 토글 의식 필요.

**채택: B + C 하이브리드** — 기본은 B(자동), `strict` 파일 존재 시 무조건 강제.

## 구현 (작은 범위)

1. `.claude/hooks/worktreeModeGate.mjs` 신규 — 공통 유틸. `shouldEnforce()` 반환
   ```js
   export function shouldEnforce(sessionId) {
     if (existsSync('.claude/worktree-mode.local') && readFileSync(...).trim() === 'strict') return true
     try {
       execSync(`bash scripts/activeSessions.sh ${sessionId ?? ''}`, { stdio: 'pipe' })
       return false  // exit 0 = 혼자
     } catch { return true }  // exit 1 = 병렬
   }
   ```
2. `requireWorktree.mjs` — `if (!shouldEnforce(input.session_id)) process.exit(0)`
3. `guardBash.mjs` — main commit/push 차단 루프에서 동일 체크
4. `sessionStartWorktree.mjs` 출력 메시지에 현재 모드 표시 (`mode: strict/relaxed`)
5. `package.json` scripts: `"wt:strict": "echo strict > .claude/worktree-mode.local"`, `"wt:relaxed": "rm -f .claude/worktree-mode.local"`

## 검증

- [ ] 단일 세션에서 main Edit 통과
- [ ] 두 번째 세션 시작 시 양쪽 다 block 발동
- [ ] `pnpm wt:strict` 후 단일 세션에서도 강제
- [ ] `/handoff` 후 registry에서 session_id 정리되면 다시 relaxed 복귀

## 기각 대안

- 시간 기반 토글(업무시간/야간) — 로컬 상태 예측 어려움
- PR 단위 토글 — 워크트리 밖에서 의사결정해야 해서 순환

## 관련

- PR #10: 기반 인프라
- feedback_ratchet_convergence: 마찰 비용 인식
- feedback_parallel_session_worktree: 원본 규약
- scripts/activeSessions.sh: 감지 SSOT
