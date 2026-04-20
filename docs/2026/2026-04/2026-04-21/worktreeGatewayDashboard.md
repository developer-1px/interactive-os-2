---
name: Worktree Gateway & Dashboard
description: 병렬 worktree 가시성·접근성 인프라 — Caddy 리버스 프록시 + 웹 대시보드
type: spec
layer: infra
status: shipped
project: infra
tags: [worktree, caddy, dashboard, parallel-session, gateway]
---

# Worktree Gateway & Dashboard

> **동기**: 병렬 worktree의 포트를 매번 확인하고 각 worktree 변경사항을 추적하는 게 어려움. 고정 URL로 접근 + 대시보드로 상태 일람.

## 구성

1. **레지스트리 SSOT**: `.claude/worktrees.json` (기존)
2. **Caddy 게이트웨이**: `.claude/Caddyfile` 자동 생성 → `wt:gateway`로 실행
3. **대시보드**: `scripts/wtDash.mjs` → `http://localhost:4000` 또는 `http://wt.localhost:4100`
4. **결정론적 포트**: 브랜치명 FNV-1a 해시, `5174 + h%30`

## 사용

```bash
# 1회 설치
brew install caddy

# 게이트웨이(다른 터미널)
pnpm wt:gateway          # :4100 에서 *.localhost 라우팅

# 대시보드(다른 터미널)
pnpm wt:dash             # :4000 — http://wt.localhost:4100 으로도 접근

# 수동 재생성
pnpm wt:caddy            # Caddyfile 재생성
pnpm wt:caddy:reload     # 재생성 + caddy reload
```

세션 시작 hook(`sessionStartWorktree.mjs`)이 `wt:caddy --reload`를 detached로 실행하므로 worktree 등록 시 자동 반영.

## 라우팅

| URL | 목적지 |
|-----|--------|
| `http://wt.localhost:4100` | 대시보드 |
| `http://feat-foo.localhost:4100` | worktree `feat-foo` 의 dev server |
| `http://localhost:{port}` | 직접 접근 (게이트웨이 없이) |

`*.localhost`는 Chrome/Safari가 자동 127.0.0.1 해석 → hosts 수정 불필요.

## 환경 변수

- `WT_GATEWAY_PORT` (기본 4100)
- `WT_DASH_PORT` (기본 4000)

## 검증

- [ ] `pnpm wt:caddy` → `.claude/Caddyfile` 생성
- [ ] `pnpm wt:dash` → `http://localhost:4000` 에서 worktree 목록 확인
- [ ] `caddy run --config .claude/Caddyfile --adapter caddyfile` 실행 후 `http://wt.localhost:4100` 접근 가능
- [ ] dev server 실행 중인 worktree를 서브도메인으로 접근 가능

## 관련

- `parallelWorktreePrd.md`: 기반 인프라
- `worktreeModeToggleBacklog.md`: 강제 모드 토글 (별도 작업)
- feedback_parallel_session_worktree
